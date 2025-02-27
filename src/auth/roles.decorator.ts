import { SetMetadata } from '@nestjs/common';
import { Role } from '../users/role.enum';

/**
 * @constant {string} ROLES_KEY
 * @description A constant key used to store roles metadata for the custom `Roles` decorator.
 * @default 'roles'
 */
export const ROLES_KEY = 'roles';

/**
 * @function Roles
 * @description A custom decorator to assign roles to routes or handlers.
 *
 * This decorator is used to set role-based metadata for methods or controllers, which can be
 * later used by guards or other mechanisms to enforce role-based access control (RBAC).
 *
 * @param {...Role[]} roles - The roles to be assigned to the route/handler.
 *
 * @returns {MethodDecorator} - A method decorator that attaches roles metadata to the route/handler.
 *
 * @example
 * @Roles(Role.ADMIN)
 * @Get('admin')
 * findAdmin() {
 *   // Only accessible by ADMIN role
 * }
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
