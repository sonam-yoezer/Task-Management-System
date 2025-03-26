import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Work } from "./work.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/users/user.entity";
import { CreateWorkDto } from "./work.dto";
import { UpdateWorkDto } from "./updatework.dto";

/**
 * Service for managing work items in the application.
 * 
 * This service contains the business logic for creating, updating, deleting, and 
 * retrieving work items. All actions are restricted to admin users.
 * 
 * - **createWork**: Creates a new work item (only for admins).
 * - **findAll**: Retrieves all work items (only for admins).
 * - **findOne**: Retrieves a specific work item by ID (only for admins).
 * - **updateWork**: Updates a work item by ID (only for admins).
 * - **deleteWork**: Deletes a work item by ID (only for admins).
 */
@Injectable()
export class WorkService {
  constructor(
    @InjectRepository(Work)
    private workRepository: Repository<Work>,
  ) { }

  /**
  * Creates a new work item.
  * 
  * @param {CreateWorkDto} workData - The data for the new work item.
  * @param {User} admin - The admin user performing the creation.
  * @returns {Promise<Work>} - The created work item.
  * @throws {ForbiddenException} - If the user is not an admin.
  */
  async createWork(workData: CreateWorkDto, admin: User) {
    if (admin.role !== 'admin') {
      throw new ForbiddenException('Only admins can create work');
    }
    const work = this.workRepository.create(workData);
    return this.workRepository.save(work);
  }

  /**
  * Retrieves all work items.
  * 
  * @param {User} admin - The admin user requesting the work items.
  * @returns {Promise<Work[]>} - A list of all work items.
  * @throws {ForbiddenException} - If the user is not an admin.
  */
  async findAll(admin: User): Promise<Work[]> {
    if (admin.role !== 'admin') {
      throw new ForbiddenException('Only admins can view the work');
    }
    return this.workRepository.find();
  }

  /**
   * Retrieves a specific work item by its ID.
   * 
   * @param {number} id - The ID of the work item to retrieve.
   * @param {User} admin - The admin user requesting the work item.
   * @returns {Promise<Work>} - The requested work item.
   * @throws {ForbiddenException} - If the user is not an admin.
   * @throws {NotFoundException} - If the work item is not found.
   */
  async findOne(id: number, admin: User): Promise<Work> {
    if (admin.role !== 'admin') {
      throw new ForbiddenException('Only admins can view the work');
    }

    const work = await this.workRepository.findOne({ where: { id } });
    if (!work) throw new NotFoundException('Work not found');

    return work;
  }

  /**
   * Updates an existing work item.
   * 
   * @param {number} id - The ID of the work item to update.
   * @param {UpdateWorkDto} updateData - The data to update the work item.
   * @param {User} admin - The admin user performing the update.
   * @returns {Promise<Work>} - The updated work item.
   * @throws {ForbiddenException} - If the user is not an admin.
   * @throws {NotFoundException} - If the work item is not found.
   */
  async updateWork(id: number, updateData: UpdateWorkDto, admin: User) {
    if (admin.role !== 'admin') {
      throw new ForbiddenException('Only admins can update work');
    }

    const work = await this.findOne(id, admin);
    Object.assign(work, updateData); // Merge new data
    return this.workRepository.save(work);
  }

  /**
   * Deletes a work item.
   * 
   * @param {number} id - The ID of the work item to delete.
   * @param {User} admin - The admin user performing the deletion.
   * @returns {Promise<{ message: string }>} - A success message.
   * @throws {ForbiddenException} - If the user is not an admin.
   * @throws {NotFoundException} - If the work item is not found.
   */
  async deleteWork(id: number, admin: User) {
    if (admin.role !== 'admin') {
      throw new ForbiddenException('Only admins can delete work');
    }
    const work = await this.findOne(id, admin);
    await this.workRepository.remove(work);
    return { message: 'Work deleted successfully' };
  }
}
