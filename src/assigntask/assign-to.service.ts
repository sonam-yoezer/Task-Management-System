import { Injectable, NotFoundException, BadRequestException, ForbiddenException, UnauthorizedException, HttpException, HttpStatus, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Work } from '../work/work.entity';
import { WorkStatus } from 'src/work/work.enum';
import { ApiResponse } from 'src/utility/ApiResponse';
import { AssignedTaskRepository } from './assign.repository';
import { AssignTaskDto, MarkAsDoneDto } from './assign.dto';
import { AssignToModel } from './assign.entity';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { MarkAsDone } from './mark-as-done.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

/**
 * Service handling task assignment logic and related database operations.
 */
@Injectable()
export class AssignToService {
  private readonly logger = new Logger(AssignToService.name);
  constructor(
    @InjectRepository(AssignToModel)
    private assignRepository: Repository<AssignToModel>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Work)
    private workRepository: Repository<Work>,

    private readonly assignedTaskRepo: AssignedTaskRepository,

    @Inject('FILE_STORAGE_PATH') private readonly fileStoragePath: string,

    @InjectRepository(MarkAsDone)
    private readonly markAsDoneRepository: Repository<MarkAsDone>,
  ) { }

  /**
   * Scheduled job that runs every minute to automatically update
   * assignment statuses from 'IN_PROGRESS' to 'INCOMPLETE' if the current
   * time is past the defined cutoff time (5:00 PM) for the day.
   *
   * Process:
   * - If the current time is before the cutoff time, the method exits without changes.
   * - If past the cutoff time, all assignments that:
   *    - Have a status of 'IN_PROGRESS'
   *    - Have today's date as their deadline
   *   will be updated to 'INCOMPLETE'.
   *
   * This ensures that assignments not completed by the cutoff time are automatically flagged as incomplete.
   *
   * @cron Runs every minute as specified by `CronExpression.EVERY_MINUTE`.
   * 
   * @returns {Promise<void>} A promise indicating the completion of the update operation.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async updateInProgressAssignmentsPastCutoff(): Promise<void> {
    const now = new Date();

    const cutoffTime = new Date();
    cutoffTime.setHours(17, 0, 0, 0);

    if (now < cutoffTime) {
      // this.logger.log('Not past cutoff time yet, skipping update');
      return;
    }

    // Using YYYY-MM-DD format for date comparison
    const todayString = now.toISOString().slice(0, 10);

    const updateResult = await this.assignRepository
      .createQueryBuilder()
      .update()
      .set({ status: WorkStatus.INCOMPLETE })
      .where('status = :inProgress', { inProgress: WorkStatus.IN_PROGRESS })
      .andWhere('DATE(dateline) = :today', { today: todayString })  // Use DATE() to compare just date portion
      .execute();

    this.logger.log(`Updated assignments count: ${updateResult.affected}`);
  }

  /**
   * Assigns a task to a user.
   * 
   * @param adminUser - The currently authenticated admin user.
   * @param assignTaskDto - The task assignment details.
   * @returns ApiResponse indicating success or failure of the operation.
   * @throws ForbiddenException if the requester is not an admin.
   * @throws NotFoundException if the user or work is not found.
   * @throws BadRequestException if task is already assigned or the user is an admin.
   */
  async assignTask(adminUser: User, assignTaskDto: AssignTaskDto): Promise<ApiResponse> {
    try {
      const { userId, workId, dateline, description } = assignTaskDto;

      if (!adminUser || adminUser.role !== 'admin') {
        throw new ForbiddenException('Only admins can assign tasks');
      }

      // Update all IN_PROGRESS assignments for today past 12:30 PM to INCOMPLETE
      await this.updateInProgressAssignmentsPastCutoff();

      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');
      if (user.role === 'admin') {
        throw new BadRequestException('Admins cannot be assigned tasks');
      }

      const work = await this.workRepository.findOne({ where: { id: workId } });
      if (!work) throw new NotFoundException('Work not found');

      const now = new Date();

      // Update existing assignments past deadline as INCOMPLETE (existing logic)
      // await this.assignRepository
      //   .createQueryBuilder()
      //   .update()
      //   .set({ status: WorkStatus.INCOMPLETE })
      //   .where("dateline < :now", { now })
      //   .andWhere("status != :completedStatus", { completedStatus: WorkStatus.COMPLETED })
      //   .execute();

      // Check existing assignment for user & work
      const existingAssignment = await this.assignRepository.findOne({
        where: { user: { id: userId }, work: { id: workId } },
      });

      if (existingAssignment) {
        throw new BadRequestException(`This task is already assigned to ${user.email}`);
      }

      const deadlineDate = new Date(dateline);
      let status = WorkStatus.IN_PROGRESS;

      const cutoffTime = new Date(deadlineDate);
      cutoffTime.setHours(17, 0, 0, 0);

      const isDeadlineToday = (
        deadlineDate.getFullYear() === now.getFullYear() &&
        deadlineDate.getMonth() === now.getMonth() &&
        deadlineDate.getDate() === now.getDate()
      );

      if (!isDeadlineToday && now >= cutoffTime) {
        status = WorkStatus.INCOMPLETE;
      } else {
        status = WorkStatus.IN_PROGRESS;
      }

      const assignment = this.assignRepository.create({
        user,
        work,
        dateline: deadlineDate,
        description,
        status,
        assignedBy: `${adminUser.firstName} ${adminUser.lastName}`,
      });

      await this.assignRepository.save(assignment);

      return new ApiResponse(true, `Task assigned to: ${user.email} by ${adminUser.firstName} ${adminUser.lastName} with status: ${status}`);
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        return new ApiResponse(false, error.message, null);
      }

      return new ApiResponse(false, 'An unexpected error occurred', null, {
        message: error.message || error.toString(),
      });
    }
  }

  /**
   * Retrieves all task assignments.
   * 
   * @returns A list of all assigned tasks.
   */
  async getAllAssignments(): Promise<any[]> {
    return this.assignedTaskRepo.findAllAssignedTasks();
  }

  /**
   * Retrieves a specific assigned task by its ID.
   * 
   * @param id - The ID of the assigned task.
   * @returns The assigned task details.
   * @throws HttpException with status 404 if task not found.
   * @throws HttpException with status 500 for unexpected errors.
   */
  async getAssignmentById(id: number): Promise<any> {
    try {
      const task = await this.assignedTaskRepo.findAssignedTaskById(id);

      if (!task) {
        throw new HttpException({
          statusCode: HttpStatus.NOT_FOUND,
          message: `No assignment found with ID ${id}`,
          error: 'Not Found',
        }, HttpStatus.NOT_FOUND);
      }

      return task;

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error('Error fetching assignment by ID:', error);

      throw new HttpException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An unexpected error occurred while retrieving the assignment.',
        error: 'Internal Server Error',
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Retrieves all users who are eligible for task assignments.
   * Only users with the role 'user' are returned.
   * 
   * @returns A list of users with their ID, full name, and email.
   */
  async getAllUsersForAssignment(): Promise<any> {
    const query = `
    SELECT id, CONCAT(firstName, ' ', lastName) AS fullName, email
    FROM user
    WHERE role = 'user'
    ORDER BY firstName ASC
  `;

    const users = await this.userRepository.query(query);

    return users;
  }

  /**
   * Retrieves a list of all available work items.
   * 
   * @returns A list of work items with their ID and name.
   */
  async getAllWorkList() {
    return this.workRepository.find({
      select: ['id', 'workName'],
    });
  }

  /**
 * Retrieves all assigned tasks for the currently authenticated user.
 *
 * Access Control:
 * - Only users with the role 'user' are allowed to access their tasks.
 * - Admins or other roles are restricted from accessing this endpoint.
 *
 * Process:
 * - Validates the current user's role.
 * - Fetches all tasks assigned to the user based on their user ID.
 * - If no tasks are found, throws a NotFoundException.
 * - If an access violation occurs, throws a ForbiddenException.
 * 
 * Error Handling:
 * - Known exceptions (ForbiddenException, NotFoundException) are returned in a standardized ApiResponse.
 * - Unexpected errors are caught and returned with detailed error information.
 * 
 * @param {User} currentUser - The currently authenticated user.
 * @returns {Promise<any>} - A promise that resolves to the list of tasks or an error response.
 */
  async getTasksByUserId(currentUser: User): Promise<any> {
    try {
      if (currentUser.role !== 'user') {
        throw new ForbiddenException('Only users can access their tasks.');
      }

      const userId = Number(currentUser.id);

      const tasks = await this.assignedTaskRepo.findTasksByUserId(userId);

      if (!tasks || tasks.length === 0) {
        throw new NotFoundException('No tasks found for this user.');
      }

      return tasks;

    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        return new ApiResponse(false, error.message, null);
      }

      return new ApiResponse(false, 'An unexpected error occurred', null, {
        message: error.message || error.toString(),
      });
    }
  }

  /**
 * Updates the status of an assigned task.
 * 
 * Access Control:
 * - Only users with the 'admin' role are permitted to perform this action.
 * 
 * Status Validation:
 * - The new status must be either 'APPROVED' or 'REJECTED'.
 * - The current status of the task must be one of the following: 'completed', 'resubmitted', or 'latesubmit'.
 * 
 * Process:
 * - Verifies the user's role.
 * - Validates the new status.
 * - Fetches the assignment by ID.
 * - Checks if the current status is eligible for update.
 * - Updates the task status and adds remarks by admin.
 * 
 * Error Handling:
 * - Throws ForbiddenException if the user is not an admin.
 * - Throws BadRequestException if the new status is invalid or the current task status is not allowed for update.
 * - Throws NotFoundException if the assignment is not found.
 * 
 * @param {User} currentUser - The currently authenticated user.
 * @param {number} assignmentId - The ID of the assignment to be updated.
 * @param {string} status - The new status to be set. Allowed values: 'APPROVED', 'REJECTED'.
 * @param {string} remarksByAdmin - Remarks provided by the admin during the status update.
 * 
 * @returns {Promise<{ success: boolean; message: string }>} - A promise resolving to a success response object.
 */
  async updateStatus(currentUser: User, assignmentId: number, status: string, remarksByAdmin: string) {
    if (currentUser.role !== 'admin') {
      throw new ForbiddenException('Only admin can perform this action.');
    }

    const validStatuses = ['APPROVED', 'REJECTED'];

    if (!validStatuses.includes(status)) {
      throw new BadRequestException('Invalid status. Allowed: APPROVED, REJECTED.');
    }

    const task = await this.assignedTaskRepo.findTaskById(assignmentId);

    if (!task || task.length === 0) {
      throw new NotFoundException(`Assignment with ID ${assignmentId} not found.`);
    }

    const currentTask = task[0];

    const allowedStatuses = ['completed', 'resubmitted', 'latesubmit'];

    if (!allowedStatuses.includes(currentTask.status)) {
      throw new BadRequestException('Status can only be updated if the current status is "completed", "resubmitted" or "latesubmit".');
    }

    await this.assignedTaskRepo.updateStatusById(assignmentId, status, remarksByAdmin);

    return {
      success: true,
      message: `Assignment status updated to ${status}.`,
    };
  }

  /**
   * Marks an assigned task as done and updates its status accordingly.
   * 
   * @param assignmentId - ID of the assigned task.
   * @param remarks - Remarks provided by the user.
   * @param file - Uploaded file (Multer).
   * @returns Confirmation message.
   */
async createMarkAsDone(
  currentUser: User,
  assignmentId: number,
  remarks: string,
  file: Express.Multer.File,
): Promise<{ success: boolean; message: string }> {
  try {
    // Find assignment with user relation
    const assignment = await this.assignRepository.findOne({
      where: { id: assignmentId },
      relations: ['user'],
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    // Ensure only the assigned user can submit
    if (assignment.user.id !== currentUser.id) {
      throw new ForbiddenException('You are not authorized to mark this assignment as done');
    }

    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Validate allowed statuses
    if (
      assignment.status !== WorkStatus.REJECTED &&
      assignment.status !== WorkStatus.IN_PROGRESS &&
      assignment.status !== WorkStatus.INCOMPLETE
    ) {
      throw new ForbiddenException('You cannot submit this assignment in its current status.');
    }

    // Generate unique filename and path using POSIX to get forward slashes
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    const filePath = path.posix.join(this.fileStoragePath, fileName);

    // Ensure directory exists
    if (!fs.existsSync(this.fileStoragePath)) {
      fs.mkdirSync(this.fileStoragePath, { recursive: true });
    }

    // Save file to disk
    fs.writeFileSync(filePath, file.buffer);

    let markAsDone;

    if (assignment.status === WorkStatus.REJECTED) {
      // Find existing markAsDone record for this assignment
      markAsDone = await this.markAsDoneRepository.findOne({
        where: { assignment: { id: assignment.id } },
      });

      if (markAsDone) {
        // Update existing record
        markAsDone.submittedDate = new Date();
        markAsDone.remarks = remarks;
        markAsDone.fileName = filePath;
      } else {
        // Fallback: If no record found, create a new one
        markAsDone = this.markAsDoneRepository.create({
          assignment,
          submittedDate: new Date(),
          remarks,
          fileName: filePath,
        });
      }

      // Update assignment status to RESUBMITTED
      assignment.status = WorkStatus.RESUBMITTED;
    } else if (assignment.status === WorkStatus.IN_PROGRESS) {
      // Create new submission and update status to COMPLETED
      markAsDone = this.markAsDoneRepository.create({
        assignment,
        submittedDate: new Date(),
        remarks,
        fileName: filePath,
      });
      assignment.status = WorkStatus.COMPLETED;
    } else if (assignment.status === WorkStatus.INCOMPLETE) {
      // Create new submission and update status to LATESUBMIT
      markAsDone = this.markAsDoneRepository.create({
        assignment,
        submittedDate: new Date(),
        remarks,
        fileName: filePath,
      });
      assignment.status = WorkStatus.LATESUBMIT;
    }

    // Save assignment and submission
    await this.assignRepository.save(assignment);
    await this.markAsDoneRepository.save(markAsDone);

    return {
      success: true,
      message: 'Task marked as done successfully.',
    };
  } catch (error) {
    if (
      error instanceof NotFoundException ||
      error instanceof ForbiddenException ||
      error instanceof BadRequestException
    ) {
      throw error;
    }

    console.error('Error in createMarkAsDone:', error);
    throw new Error('Failed to mark assignment as done. Please try again.');
  }
}


  async getTasksByStatus(status: string, user: any): Promise<any> {
    // Role Check
    if (user?.role !== 'admin') {
      throw new ForbiddenException('You do not have permission to access this resource');
    }

    const VALID_STATUSES = [
      'in-progress',
      'completed',
      'incomplete',
      'approved',
      'rejected',
      'resubmitted',
      'latesubmit',
    ];

    // Validate if the provided status is allowed
    if (!VALID_STATUSES.includes(status)) {
      throw new BadRequestException(`Invalid status: ${status}. Allowed statuses are: ${VALID_STATUSES.join(', ')}`);
    }

    const tasks = await this.assignedTaskRepo.findTasksByStatus(status);

    if (!tasks || tasks.length === 0) {
      throw new NotFoundException(`No tasks found with status: ${status}`);
    }

    return tasks;
  }

}
