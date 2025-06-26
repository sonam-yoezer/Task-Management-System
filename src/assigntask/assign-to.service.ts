import { Injectable, NotFoundException, BadRequestException, ForbiddenException, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Work } from '../work/work.entity';
import { WorkStatus } from 'src/work/work.enum';
import { ApiResponse } from 'src/utility/ApiResponse';
import { AssignedTaskRepository } from './assign.repository';
import { AssignTaskDto } from './assign.dto';
import { AssignToModel } from './assign.entity';

/**
 * Service handling task assignment logic and related database operations.
 */
@Injectable()
export class AssignToService {
  constructor(
    @InjectRepository(AssignToModel)
    private assignRepository: Repository<AssignToModel>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Work)
    private workRepository: Repository<Work>,

    private readonly assignedTaskRepo: AssignedTaskRepository
  ) { }

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

      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');
      if (user.role === 'admin') {
        throw new BadRequestException('Admins cannot be assigned tasks');
      }

      const work = await this.workRepository.findOne({ where: { id: workId } });
      if (!work) throw new NotFoundException('Work not found');

      const existingAssignment = await this.assignRepository.findOne({
        where: { user: { id: userId }, work: { id: workId } },
      });
      if (existingAssignment) {
        throw new BadRequestException(`This task is already assigned to ${user.email}`);
      }

      const assignment = this.assignRepository.create({
        user,
        work,
        dateline: new Date(dateline),
        description,
        status: WorkStatus.IN_PROGRESS,
      });

      await this.assignRepository.save(assignment);

      return new ApiResponse(true, `Task assigned to: ${user.email}`);
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

}
