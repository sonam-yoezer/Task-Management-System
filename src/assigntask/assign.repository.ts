import { DataSource, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AssignedTaskRepository {
  constructor(private dataSource: DataSource) { }

  async findAllAssignedTasks(): Promise<any[]> {
    return this.dataSource.query(`
      SELECT 
        assignment_id,
        dateline,
        status,
        task_description,
        user_id,
        email,
        firstName,
        lastName,
        user_role,
        work_id,
        workName,
        description,
        work_created_at,
        work_updated_at
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
      user_id,
      email,
      firstName,
      lastName,
      user_role,
      work_id,
      workName,
      description,
      work_created_at,
      work_updated_at
    FROM assigned_tasks_view
    WHERE assignment_id = ?
    `,
      [assignment_id]
    );

    // Return the first object or null if empty
    return result.length > 0 ? result[0] : null;
  }

}
