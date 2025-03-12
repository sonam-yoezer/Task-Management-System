import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { JwtStrategy } from './jwt.strategy';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/Users/user.module';

/**
 * @module AuthModule
 * @description Handles authentication and authorization functionalities within the application.
 *
 * @imports
 * - `TypeOrmModule.forFeature([User])`: Registers the `User` entity for database operations.
 * - `PassportModule.register({ defaultStrategy: 'jwt' })`: Enables authentication strategies with JWT as the default.
 * - `JwtModule.register({ secret, signOptions })`: Configures JWT authentication with a secret key and expiration settings.
 *
 * @providers
 * - `AuthService`: Manages user authentication logic.
 * - `JwtStrategy`: Handles JWT-based authentication strategy.
 *
 * @controllers
 * - `AuthController`: Defines authentication-related API endpoints (signup, login, token refresh).
 *
 * @exports
 * - `JwtStrategy`: Makes the JWT authentication strategy available to other modules.
 * - `PassportModule`: Enables authentication throughout the application.
 *
 * @example
 * Importing `AuthModule` in another module:
 * ```ts
 * import { AuthModule } from './auth/auth.module';
 *
 * @Module({
 *   imports: [AuthModule]
 * })
 * export class AppModule {}
 * ```
 */

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), // Add this line to make UserRepository available
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: jwtConstants.accessTokenExpiration },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [JwtStrategy, PassportModule],
}) 
export class AuthModule {}
