import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Custom decorator to extract the authenticated user from the request object.
 *
 * @param {unknown} data - Unused parameter, kept for compatibility with NestJS decorators.
 * @param {ExecutionContext} ctx - The execution context of the request.
 * @returns {any} - The authenticated user extracted from the request.
 *
 * @example
 * ```typescript
 * @Get('profile')
 * getProfile(@User() user: UserEntity) {
 *   return user;
 * }
 * ```
 */
export const User = createParamDecorator((data, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user; // Extracts the authenticated user
});
