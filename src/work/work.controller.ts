import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { WorkService } from "./work.service";
import { User } from "src/users/user.decorator";
import { User as UserEntity } from "src/users/user.entity";
import { CreateWorkDto } from "./work.dto";
import { UpdateWorkDto } from "./updatework.dto";

/**
 * Controller for managing work-related operations.
 * 
 * This controller provides endpoints for creating, retrieving, updating, and deleting work items.
 * All routes are protected with JWT authentication.
 * Only administrators can perform these actions.
 */
@UseGuards(AuthGuard('jwt'))
@Controller('work')
export class WorkController {

    /**
     * Constructor to inject WorkService.
     * @param {WorkService} workService - Service for handling work operations.
     */
    constructor(private readonly workService: WorkService) { }

    /**
     * Creates a new work item.
     * 
     * Only admins are allowed to perform this action.
     * 
     * @param {CreateWorkDto} workData - The validated data required to create a work item.
     * @param {UserEntity} admin - The authenticated admin user performing the action.
     * @returns {Promise<Work>} - The newly created work item.
     * @throws {ForbiddenException} If the user is not an admin.
     */
    @Post()
    async create(@Body() workData: CreateWorkDto, @User() admin: UserEntity) {
        return this.workService.createWork(workData, admin);
    }

    /**
     * Retrieve all work items.
     * Only admins can view all work items.
     *
     * @param {UserEntity} admin - The authenticated user (admin) requesting the data.
     * @returns {Promise<any[]>} - A list of all work items.
     */
    @Get()
    async findAll(@User() admin) {
        return this.workService.findAll(admin);
    }

    /**
     * Retrieve a single work item by ID.
     * Only admins can access this endpoint.
     *
     * @param {number} id - The ID of the work item.
     * @param {UserEntity} admin - The authenticated user (admin) requesting the data.
     * @returns {Promise<any>} - The work item if found.
     */
    @Get(':id')
    async findOne(@Param('id') id: number, @User() admin: UserEntity) {
        return this.workService.findOne(id, admin);
    }

    /**
     * Updates an existing work item by its ID.
     * 
     * Only admins are allowed to perform this operation.
     * 
     * @param {number} id - The unique identifier of the work item to be updated.
     * @param {UpdateWorkDto} updateData - The validated data to update the work item.
     * @param {UserEntity} admin - The authenticated admin user performing the update.
     * @returns {Promise<Work>} - The updated work item.
     * @throws {ForbiddenException} If the user is not an admin.
     * @throws {NotFoundException} If the work item does not exist.
     */
    @Put(':id')
    async update(@Param('id') id: number, @Body() updateData: UpdateWorkDto, @User() admin: UserEntity) {
        return this.workService.updateWork(id, updateData, admin);
    }

    /**
     * Delete a work item by ID.
     * Only admins can delete work items.
     *
     * @param {number} id - The ID of the work item to delete.
     * @param {UserEntity} admin - The authenticated user (admin) performing the deletion.
     * @returns {Promise<{message: string}>} - Confirmation of successful deletion.
     */
    @Delete(':id')
    async delete(@Param('id') id: number, @User() admin) {
        return this.workService.deleteWork(id, admin);
    }
}
