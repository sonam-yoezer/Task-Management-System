/**
 * Enum representing the possible statuses of a work item.
 * 
 * - `PENDING`: The work item is yet to be started.
 * - `IN_PROGRESS`: The work item is currently being worked on.
 * - `COMPLETED`: The work item has been finished.
 */
export enum WorkStatus {

  /**
   * The work item is in a pending state and has not yet started.
   * 
   * @example "pending"
   */
  PENDING = 'pending',

  /**
   * The work item is actively being worked on.
   * 
   * @example "in-progress"
   */
  IN_PROGRESS = 'in-progress',

  /**
   * The work item has been completed.
   * 
   * @example "completed"
   */
  COMPLETED = 'completed',

  INCOMPLETE = 'incomplete',

  APPROVED = 'approved',

  REJECTED = 'rejected',

  RESUBMITTED = 'resubmitted',

  LATESUBMIT = 'latesubmit'
}
