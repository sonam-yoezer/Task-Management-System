import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../users/role.enum';
import { ROLES_KEY } from './roles.decorator';

/**
 * @class RolesGuard
 * @implements {CanActivate}
 * @description A guard that checks if the user has the required roles to access a route or handler.
 *
 * This guard is used to enforce role-based access control (RBAC) by checking if the user
 * has at least one of the roles defined by the `Roles` decorator on the route or controller.
 *
 * If the roles are not specified, the route is accessible to all users.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  /**
   * @constructor
   * @param {Reflector} reflector - The `Reflector` service used to access metadata from the decorator.
   * @description Initializes the `RolesGuard` to use the `Reflector` for extracting roles metadata.
   */
  constructor(private reflector: Reflector) {}

  /**
   * @method canActivate
   * @description Determines if the current request has the required roles to access the route.
   *
   * The method retrieves the roles metadata set by the `Roles` decorator using `Reflector`. If the
   * metadata is not found, access is granted. If roles are found, it checks if the user's role matches
   * any of the required roles.
   *
   * @param {ExecutionContext} context - The execution context containing the request and metadata.
   * @returns {boolean} - Returns `true` if the user has any of the required roles, `false` otherwise.
   *
   * @throws {UnauthorizedException} - Throws an exception if the user does not have the required roles.
   */
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.role?.includes(role));
  }
}
