import { Controller, Post, Body, UseGuards, ForbiddenException, Req, Get, Param, UseInterceptors, UploadedFile, Query, BadRequestException } from '@nestjs/common';
import { AssignToService } from './assign-to.service';
import { AuthGuard } from '@nestjs/passport';
import { AssignTaskDto, MarkAsDoneDto, UpdateStatusDto } from './assign.dto';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MarkAsDone } from './mark-as-done.entity';


/**
 * Controller responsible for handling assignment-related API endpoints.
 * All routes are protected using JWT authentication.
 */
@Controller('api/assign')
@UseGuards(AuthGuard('jwt'))
export class AssignToController {
  constructor(private readonly assignService: AssignToService) { }

  /**
   * Assigns a task to a user.
   * 
   * @param req - The incoming request object containing the authenticated user.
   * @param assignTaskDto - Data transfer object containing task assignment details.
   * @returns The result of the assignment operation.
   */
  @Post('/assignTask')
  async assignTask(@Req() req, @Body() assignTaskDto: AssignTaskDto) {
    return this.assignService.assignTask(req.user, assignTaskDto);
  }

  /**
   * Retrieves all task assignments.
   * 
   * @returns A list of all task assignments.
   */
  @Get('/allTasks')
  async getAllAssignments() {
    return this.assignService.getAllAssignments();
  }

  /**
   * Retrieves a specific task by its ID.
   * 
   * @param id - The unique identifier of the task.
   * @returns The task assignment details.
   */
  @Get('/task/:id')
  async getTaskById(@Param('id') id: number) {
    return this.assignService.getAssignmentById(id);
  }

  /**
     * Retrieves a list of all users available for task assignments.
     * 
     * @returns A list of users.
     */
  @Get('/userList')
  async getAllUsers() {
    return this.assignService.getAllUsersForAssignment();
  }

  /**
   * Retrieves the list of all available work items.
   * 
   * @returns A list of work items.
   */
  @Get('/workList')
  async getAllWorkList() {
    return this.assignService.getAllWorkList();
  }

  /**
 * GET /user-tasks
 * 
 * Retrieves all tasks assigned to the currently authenticated user.
 * 
 * Access Control:
 * - Only accessible by users with the 'user' role.
 * 
 * @param {Request} req - The HTTP request object containing the authenticated user.
 * @returns {Promise<any>} - A promise resolving to the list of assigned tasks or an error response.
 */
  @Get('/user-tasks')
  async getTasksByUserId(@Req() req) {
    return this.assignService.getTasksByUserId(req.user);
  }

  /**
 * POST /update-status/:assignmentId/:status
 * 
 * Allows an admin to update the status of a specific assignment.
 * 
 * Access Control:
 * - Only users with the 'admin' role are allowed to perform this operation.
 * 
 * Status Validation:
 * - Allowed statuses: 'APPROVED', 'REJECTED'
 * - The assignment's current status must be 'completed', 'resubmitted', or 'latesubmit'.
 * 
 * @param {Request} req - The HTTP request object containing the authenticated admin user.
 * @param {number} assignmentId - The ID of the assignment to update.
 * @param {'APPROVED' | 'REJECTED'} status - The new status to set.
 * @param {UpdateStatusDto} updateStatusDto - Data Transfer Object containing remarks from the admin.
 * 
 * @returns {Promise<{ success: boolean; message: string }>} - A promise resolving to a success response or error.
 */
  @Post('/update-status/:assignmentId/:status')
  async updateStatus(
    @Req() req,
    @Param('assignmentId') assignmentId: number,
    @Param('status') status: 'APPROVED' | 'REJECTED',
    @Body() updateStatusDto: UpdateStatusDto
  ) {
    const { remarksByAdmin } = updateStatusDto;
    return this.assignService.updateStatus(req.user, assignmentId, status, remarksByAdmin);
  }

  /**
 * POST /markAsDone/:assignmentId
 * 
 * Marks an assignment as completed by uploading a supporting file and providing remarks.
 * 
 * Access Control:
 * - Only authenticated users can submit tasks.
 * 
 * Validation:
 * - Both 'remarks' and a 'file' are required.
 * 
 * Swagger Documentation:
 * - Consumes 'multipart/form-data'.
 * - Accepts a file and a remarks string.
 * 
 * @param {Request} req - The HTTP request object containing the authenticated user.
 * @param {number} assignmentId - The ID of the assignment to mark as done.
 * @param {string} remarks - Remarks provided by the user.
 * @param {Express.Multer.File} file - Uploaded file supporting the task submission.
 * 
 * @returns {Promise<{ success: boolean; message: string }>} - A promise resolving to a success response or error.
 * 
 * @throws {BadRequestException} - If either the file or remarks are missing.
 */
  @Post('/markAsDone/:assignmentId')
  @ApiOperation({ summary: 'Mark assignment as done with remarks and file upload' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload file with remarks',
    schema: {
      type: 'object',
      properties: {
        remarks: { type: 'string' },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['remarks', 'file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async markAsDone(
    @Req() req,
    @Param('assignmentId') assignmentId: number,
    @Body('remarks') remarks: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ success: boolean; message: string }> {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    if (!remarks) {
      throw new BadRequestException('Remarks are required');
    }

    return this.assignService.createMarkAsDone(
      req.user,
      assignmentId,
      remarks,
      file,
    );
  }

  /**
   * GET /tasks-by-status/:status
   * 
   * Retrieves all tasks filtered by a specific status.
   * 
   * @param {string} status - The status to filter tasks by.
   * @returns {Promise<any[]>} - A list of tasks matching the status.
   */
  @Get('/getTaskByStatus/:status')
  async getTasksByStatus(@Param('status') status: string, @Req() req) {
    return this.assignService.getTasksByStatus(status, req.user);
  }

}
