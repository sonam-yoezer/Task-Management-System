import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';
import { jwtConstants } from './constants';

/**
 * @class JwtStrategy
 * @extends PassportStrategy(Strategy)
 * @description Implements the JWT strategy to handle JWT token extraction and validation for authentication.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  /**
   * @constructor
   * @param {AuthService} authService - The AuthService used to validate user credentials.
   * @description Initializes the JwtStrategy with necessary configurations.
   */
  constructor(private authService: AuthService) {
    super({
      /**
       * @property {function} jwtFromRequest - Extracts JWT token from the Authorization header as a Bearer token.
       * @default ExtractJwt.fromAuthHeaderAsBearerToken()
       */
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      /**
       * @property {boolean} ignoreExpiration - Determines whether to ignore token expiration.
       * @default false (expiration is not ignored)
       */
      ignoreExpiration: false,

      /**
       * @property {string} secretOrKey - The secret key used to verify the token, sourced from `jwtConstants.secret`.
       */
      secretOrKey: jwtConstants.secret,
    });
  }

  /**
   * @method validate
   * @description Validates the payload from the JWT and returns the relevant user information.
   * @param {any} payload - The decoded JWT payload containing user data.
   * @returns {Promise<{ userId: string, username: string, role: string }>} - The validated user information.
   */
  async validate(payload: any) {
    return {
      userId: payload.sub,
      username: payload.username,
      role: payload.role,
    };
  }
}
