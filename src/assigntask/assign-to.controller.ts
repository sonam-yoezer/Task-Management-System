import { Controller, Post, Body, UseGuards, ForbiddenException, Req, Get, Param } from '@nestjs/common';
import { AssignToService } from './assign-to.service';
import { AuthGuard } from '@nestjs/passport';
import { AssignTaskDto } from './assign.dto';


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

}
