/**
 * Generic API response wrapper to standardize service and controller responses.
 * 
 * @template T - The type of the data being returned (defaults to any).
 */
export class ApiResponse<T = any> {
  success: boolean;
  message: string;
  error?: any;

  /**
   * Creates an instance of ApiResponse.
   * 
   * @param success - Whether the request was successful.
   * @param message - A message describing the result.
   * @param data - Optional data payload (unused in this class but can be extended if needed).
   * @param error - Optional error details.
   */
  constructor(success: boolean, message: string, data?: T, error?: any) {
    this.success = success;
    this.message = message;
    if (error !== undefined) this.error = error;
  }
}
