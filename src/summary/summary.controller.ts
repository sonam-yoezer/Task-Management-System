import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { SummaryService } from "./summary.service";

/**
 * Controller for handling task summary endpoints.
 * Provides summary data for both admin and user roles.
 *
 * @route /api/assign
 * @guard AuthGuard('jwt') - Requires JWT authentication for all routes.
 */
@Controller('api/assign')
@UseGuards(AuthGuard('jwt'))
export class SummaryController {
  constructor(private readonly summaryService: SummaryService) { }

  /**
   * Retrieves the overall task summary for admin users.
   * This summary typically includes aggregated data across all users or tasks.
   *
   * @param req - The HTTP request object containing the authenticated user information.
   * @returns The admin task summary data.
   *
   * @route GET /api/assign/admin/summary
   * @access Protected (JWT required)
   */
  @Get('/admin/summary')
  async getSummary(@Req() req) {
    return this.summaryService.getSummary(req.user);
  }

  /**
   * Retrieves the task summary specific to the authenticated user.
   * This summary typically includes the user's total, completed, in-progress, overdue, and upcoming tasks.
   *
   * @param req - The HTTP request object containing the authenticated user information.
   * @returns The task summary data for the current user.
   *
   * @route GET /api/assign/user/summary
   * @access Protected (JWT required)
   */
  @Get('/user/summary')
  async getUserSummary(@Req() req) {
    return this.summaryService.getUserSummary(req.user);
  }

}
