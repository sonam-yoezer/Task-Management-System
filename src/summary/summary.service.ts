import { ForbiddenException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { AssignToModel } from "src/assigntask/assign.entity";
import { Work } from "src/work/work.entity";
import { WorkStatus } from "src/work/work.enum";
import { LessThanOrEqual, Repository } from "typeorm";

/**
 * Service responsible for providing task summary data
 * for both admin users and regular users.
 */
@Injectable()
export class SummaryService {
    constructor(
        @InjectRepository(AssignToModel)
        private readonly assignRepository: Repository<AssignToModel>,
        @InjectRepository(Work)
        private readonly workRepository: Repository<Work>,
    ) { }

    /**
    * Retrieves the overall task summary for admin users.
    * Includes total tasks, completed tasks, in-progress tasks, overdue tasks,
    * recent upcoming tasks, and recent work activities.
    *
    * @param user - The authenticated user object (must have admin role).
    * @throws {ForbiddenException} If the user is not an admin.
    * @returns An object containing aggregated task summary data for the admin dashboard.
    */
    async getSummary(user: any) {
        if (user?.role !== 'admin') {
            throw new ForbiddenException('You do not have permission to access this resource');
        }

        const totalTasks = await this.assignRepository.count();

        const completedTasks = await this.assignRepository.count({
            where: [
                { status: WorkStatus.COMPLETED },
                { status: WorkStatus.APPROVED }
            ]
        });

        const inProgressTasks = await this.assignRepository.count({ where: { status: WorkStatus.IN_PROGRESS } });

        const overdueTasks = await this.assignRepository.count({
            where: [
                { dateline: LessThanOrEqual(new Date()), status: WorkStatus.INCOMPLETE }
            ]
        });

        const upcomingTasks = await this.assignRepository.find({
            order: { dateline: 'DESC' },  // recently assigned
            take: 5,
            relations: ['work', 'user'],
        });


        const recentActivities = await this.workRepository.find({
            order: { updatedAt: 'DESC' },
            take: 5,
        });

        return {
            totalTasks,
            completedTasks,
            inProgressTasks,
            overdueTasks,
            upcomingTasks: upcomingTasks.map(task => ({
                workName: task.work.workName,
                dateline: task.dateline,
                firstName: task.user.firstName,
                lastName: task.user.lastName,
            })),
            recentActivities: recentActivities.map(work => ({
                description: `${work.workName} work has been updated`,
                timestamp: work.updatedAt,
            })),
        };
    }

    /**
     * Retrieves the task summary for a specific user.
     * Includes the user's total tasks, completed tasks, in-progress tasks,
     * overdue tasks, upcoming tasks, and recent activities.
     *
     * @param user - The authenticated user object (must have 'user' role).
     * @throws {ForbiddenException} If the user role is not 'user'.
     * @returns An object containing task summary data for the current user.
     */
    async getUserSummary(user: any) {
        if (user?.role?.toLowerCase() !== 'user') {
            throw new ForbiddenException('You do not have permission to access this resource');
        }

        const totalTasks = await this.assignRepository.count({
            where: { user: { id: user.id } },
        });

        const completedTasks = await this.assignRepository.count({
            where: [
                { user: { id: user.id }, status: WorkStatus.COMPLETED },
                { user: { id: user.id }, status: WorkStatus.APPROVED }
            ]
        });

        const inProgressTasks = await this.assignRepository.count({
            where: { user: { id: user.id }, status: WorkStatus.IN_PROGRESS }
        });

        const overdueTasks = await this.assignRepository.count({
            where: [
                { user: { id: user.id }, dateline: LessThanOrEqual(new Date()), status: WorkStatus.INCOMPLETE }
            ]
        });

        const upcomingTasks = await this.assignRepository.find({
            where: { user: { id: user.id } },
            order: { dateline: 'DESC' },
            take: 5,
            relations: ['work'],
        });

        const recentActivities = await this.assignRepository.find({
            where: { user: { id: user.id } },
            order: { dateline: 'DESC' },
            take: 5,
            relations: ['work'],
        });

        return {
            totalTasks,
            completedTasks,
            inProgressTasks,
            overdueTasks,
            upcomingTasks: upcomingTasks.map(task => ({
                workName: task.work.workName,
                dateline: task.dateline,
                status: task.status,
            })),
            recentActivities: recentActivities.map(task => ({
                description: `${task.work.workName} work has been updated`,
                timestamp: task.dateline,
            })),
        };
    }

}
