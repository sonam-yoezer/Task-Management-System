import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { WorkStatus } from './work.enum';

/**
 * Represents a work entity in the system.
 * 
 * This entity stores details about a specific work item, including its name, 
 * description, status, and timestamps for creation and updates.
 */
@Entity()
export class Work {

  /**
   * The unique identifier for the work item.
   * 
   * - Auto-generated primary key.
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * The name of the work item.
   * 
   * - Must be unique across all work items.
   * 
   * @example "Project Management"
   */
  @Column({ unique: true })
  workName: string;

   /**
   * A detailed description of the work item.
   * 
   * - Stored as a text field.
   * 
   * @example "This task involves handling project timelines and team collaboration."
   */
  @Column('text')
  description: string;

  /**
   * The timestamp when the work item was created.
   * 
   * - Automatically generated upon creation.
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * The timestamp when the work item was last updated.
   * 
   * - Automatically updated when any changes occur.
   */
  @UpdateDateColumn()
  updatedAt: Date;

}
