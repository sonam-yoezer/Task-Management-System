import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./user.entity";
import { Repository } from "typeorm";

/**
 * **UserService**
 * 
 * Provides user management functionalities, including retrieval, updating, and deletion of users.
 */
@Injectable()
export class UserService {

    /**
     * Constructor to inject the UserRepository.
     * @param {Repository<User>} userRepository - TypeORM repository for user entity operations.
     */
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    /**
    * Retrieves all users from the database.
    * @returns {Promise<User[]>} A list of all users.
    */
    async findAll(): Promise<User[]> {
        return this.userRepository.find();
    }

    /**
    * Retrieves a single user by their ID.
    * @param {number} id - The ID of the user to retrieve.
    * @throws {NotFoundException} If the user is not found.
    * @returns {Promise<User>} The user data.
    */
    async findOne(id: number): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    /**
    * Updates a user's details.
    * Only the user themselves or an admin can perform this action.
    * 
    * @param {number} id - The ID of the user to update.
    * @param {Partial<User>} updateData - The fields to update.
    * @param {User} currentUser - The currently authenticated user.
    * @throws {ForbiddenException} If the user is not authorized to update this account.
    * @returns {Promise<User>} The updated user data.
    */
    async update(id: number, updateData: Partial<User>, currentUser: User): Promise<User> {
        // Check if the authenticated user's id matches or if the user is an admin.
        if (currentUser.id !== id && currentUser.role !== 'admin') {
            throw new ForbiddenException('You are not allowed to edit this user');
        }
        await this.userRepository.update(id, updateData);
        return this.findOne(id);
    }

    /**
     * Deletes a user account.
     * Users can only delete their own accounts.
     * 
     * @param {number} id - The ID of the user to delete.
     * @param {User} currentUser - The currently authenticated user.
     * @throws {ForbiddenException} If the user tries to delete another user's account.
     * @throws {NotFoundException} If the user does not exist.
     * @returns {Promise<string>} A success message indicating the user was deleted.
     */
    async delete(id: number, currentUser: User): Promise<string> {
        if (currentUser.id !== id) {
            throw new ForbiddenException('You can only delete your own account');
        }

        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        await this.userRepository.delete(id);
        return 'User deleted successfully';
    }

}
