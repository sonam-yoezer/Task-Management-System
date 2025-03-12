import { Controller, ForbiddenException, Get, UseGuards, Request, Param, Body, Put, ParseIntPipe, Delete, } from "@nestjs/common";
import { UserService } from "./user.service";
import { AuthGuard } from "@nestjs/passport";
import { User } from "./user.entity";

/**
 * **UserController**
 * 
 * Handles user-related operations, including retrieval, updating, and deletion of user accounts.
 * All endpoints are protected by JWT authentication.
 */
@UseGuards(AuthGuard('jwt'))
@Controller('user')
export class UserController {
    /**
  * Constructor to inject UserService.
  * @param {UserService} userService - Service handling user operations.
  */
    constructor(private readonly userService: UserService) { }

    /**
    * Retrieves all users (Admin only).
    * @param {Request} req - The HTTP request object containing user details.
    * @throws {ForbiddenException} If the user is not an admin.
    * @returns {Promise<User[]>} A list of all users.
    */
    @Get()
    async findAll(@Request() req) {
        if (req.user.role !== 'admin') {
            throw new ForbiddenException('Access denied');
        }
        return this.userService.findAll();
    }

    /**
    * Retrieves a single user by ID (Admin only).
    * @param {number} id - The ID of the user to retrieve.
    * @param {Request} req - The HTTP request object containing user details.
    * @throws {ForbiddenException} If the user is not an admin.
    * @returns {Promise<User>} The user data.
    */
    @Get(':id')
    async findOne(@Param('id') id: number, @Request() req) {
        if (req.user.role !== 'admin') {
            throw new ForbiddenException('Access denied');
        }
        return this.userService.findOne(id);
    }

    /**
  * Updates a user's details.
  * @param {number} id - The ID of the user to update.
  * @param {Partial<User>} updateData - The fields to update.
  * @param {Request} req - The HTTP request object containing user details.
  * @returns {Promise<User>} The updated user data.
  */
    @Put(':id')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateData: Partial<User>,
        @Request() req
    ) {
        return this.userService.update(id, updateData, req.user);
    }

    /**
    * Deletes a user account (User can only delete their own account).
    * @param {number} id - The ID of the user to delete.
    * @param {Request} req - The HTTP request object containing user details.
    * @returns {Promise<string>} Success message.
    * @throws {ForbiddenException} If the user tries to delete another user's account.
    */
    @Delete(':id')
    async delete(@Param('id', ParseIntPipe) id: number, @Request() req) {
        return this.userService.delete(id, req.user);
    }

}
