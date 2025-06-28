import { DataSource, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { AssignToModel } from './assign.entity';

@Injectable()
export class AssignedTaskRepository {
  create(arg0: { assignment: AssignToModel; submittedDate: Date; remarks: string; fileName: string; }) {
    throw new Error('Method not implemented.');
  }
  save(markAsDone: any) {
    throw new Error('Method not implemented.');
  }
  constructor(private dataSource: DataSource) { }

  async findAllAssignedTasks(): Promise<any[]> {
    return this.dataSource.query(`
      SELECT 
        assignment_id,
        dateline,
        status,
        task_description,
        remarks_by_admin,
        assigned_by,
        user_id,
        email,
        firstName,
        lastName,
        user_role,
        work_id,
        workName,
        description,
        work_created_at,
        work_updated_at,
        submission_dateline,
        submission_remarks
      FROM assigned_tasks_view
      ORDER BY dateline ASC
    `);
  }

  async findAssignedTaskById(assignment_id: number): Promise<any> {
    const result = await this.dataSource.query(
      `
    SELECT 
      assignment_id,
      dateline,
      status,
      task_description,
      remarks_by_admin,
      assigned_by,
      user_id,
      email,
      firstName,
      lastName,
      user_role,
      work_id,
      workName,
      description,
      work_created_at,
      work_updated_at,
      submission_dateline,
      submission_remarks
    FROM assigned_tasks_view
    WHERE assignment_id = ?
    `,
      [assignment_id]
    );

    // Return the first object or null if empty
    return result.length > 0 ? result[0] : null;
  }

  async findTasksByUserId(user_id: number): Promise<any[]> {
    return await this.dataSource.query(
      `
    SELECT 
      assignment_id,
      dateline,
      status,
      task_description,
      assigned_by,
      remarks_by_admin,
      user_id,
      email,
      firstName,
      lastName,
      user_role,
      work_id,
      workName,
      description,
      work_created_at,
      work_updated_at,
      submission_dateline,
      submission_remarks
    FROM assigned_tasks_view
    WHERE user_id = ?
    `,
      [user_id]
    );
  }

  async findTaskById(id: number): Promise<any> {
    return await this.dataSource.query(
      `SELECT * FROM assign_to WHERE id = ?`,
      [id]
    );
  }

  async updateStatusById(id: number, status: string, remarksByAdmin: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE assign_to SET status = ?, remarksByAdmin = ? WHERE id = ?`,
      [status, remarksByAdmin, id]
    );
  }

}
