import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/user.entity';
import { jwtConstants } from './constants';
import { Role } from 'src/Users/role.enum';
import { LoginDto } from './login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) { }

  /**
   * @method validateUser
   * @description Validates user credentials and returns user details (excluding password) if authentication is successful.
   *
   * @param {string} email - The email of the user.
   * @param {string} pass - The plaintext password to validate.
   *
   * @returns {Promise<any>} - Returns user details (excluding password) if valid; otherwise, returns `null`.
   */
  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  /**
   * @method signup
   * @description Creates a new user, hashes the password, and stores user details in the database.
   *
   * @param {string} email - The email of the user.
   * @param {string} password - The plaintext password to be hashed.
   * @param {string} firstName - The first name of the user.
   * @param {string} lastName - The last name of the user.
   *
   * @throws {ConflictException} - If the user with the given email already exists.
   *
   * @returns {Promise<{ message: string }>} - A success message indicating user creation.
   */
  async signup(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) {
    const existingUser = await this.usersRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await this.usersRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: Role.USER,
    });

    await this.usersRepository.save(newUser);
    return { message: 'User created successfully' };
  }

  /**
   * @method login
   * Handles the login process by validating the user's credentials and generating access and refresh tokens.
   * 
   * @param {LoginDto} loginDto - The data transfer object containing the login credentials (email and password).
   * @returns {Promise<{ access_token: string, refresh_token: string }>} A promise that resolves to an object containing
   * - {string} access_token - The generated JWT access token.
   * - {string} refresh_token - The generated JWT refresh token.
   * - {string} role - The role of the authenticated user.
   *  
   * @throws {UnauthorizedException} If the user credentials are invalid or if token generation fails.
   * 
   * @security
   * - The password is securely hashed and stored in the database.
   * - The access token has a short expiration time for security reasons.
   * - The refresh token is stored in the database and should be securely managed.
   * 
   * @example
   * const result = await login({ email: 'user@example.com', password: 'password123' });
   * console.log(result.access_token);  // The access token
   * console.log(result.refresh_token); // The refresh token
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.usersRepository.findOne({ where: { email } });

    // Check if user exists
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Create JWT payload
    const payload = { email: user.email, sub: user.id, role: user.role };

    try {
      // Generate access token
      const accessToken = this.jwtService.sign(payload, {
        secret: jwtConstants.secret,
        expiresIn: jwtConstants.accessTokenExpiration,
      });

      // Generate refresh token
      const refreshToken = this.jwtService.sign(payload, {
        secret: jwtConstants.refreshSecret,
        expiresIn: jwtConstants.refreshTokenExpiration,
      });

      await this.usersRepository.update(user.id, { refreshToken });

      // Return tokens and role
      return {
        access_token: accessToken,
        refresh_token: refreshToken,
        role: user.role,
      };
    } catch (error) {
      throw new UnauthorizedException('Failed to generate tokens');
    }
  }

  /**
 * @method refreshToken
 * @description Refreshes authentication tokens using a valid refresh token. Verifies the token,
 *              checks it against the stored user token, generates new tokens, and updates the
 *              database with the new refresh token.
 *
 * @param {string} token - The refresh token provided by the client in the Authorization header.
 *
 * @throws {UnauthorizedException} If the refresh token is invalid, expired, doesn't match the stored token,
 *                                 or if the user is not found.
 *
 * @returns {Promise<{ access_token: string, refresh_token: string }>} A promise resolving to an object
 *          containing a new access token and refresh token pair.
 */
  async refreshToken(token: string) {
    try {
      // Verify token
      const payload = this.jwtService.verify(token, {
        secret: jwtConstants.refreshSecret,
      });
      // Fetch user
      const user = await this.usersRepository.findOne({
        where: { id: payload.sub }, // Use sub instead of id if that's what's in payload
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      // Check token match
      if (!user.refreshToken || user.refreshToken !== token) {
        throw new UnauthorizedException('Invalid refresh token - tokens do not match');
      }

      // Generate new tokens
      const newTokens = await this.generateTokens(user);

      // Update refresh token in database
      await this.usersRepository.update(
        { id: user.id },
        { refreshToken: newTokens.refresh_token }
      );

      return newTokens;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Refresh token expired');
      }
      throw new UnauthorizedException(error.message || 'Invalid refresh token');
    }
  }


  /**
  * @method getUserProfile
  * @description Retrieves the profile details of a user by their ID.
  * @param {number} userId - The unique identifier of the user.
  * @returns {Promise<{ id: number, firstName: string, lastName: string, email: string, role: string }>}  
  *          A promise resolving to the user's profile details.
  * @throws {NotFoundException} If the user is not found in the database.
  */
  async getUserProfile(userId: number) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    };
  }

  /**
 * Generates an access token and a refresh token for a given user, and updates the user's record with the refresh token.
 *
 * @param {User} user - The user object containing user details such as email, id, and role.
 * @returns {Promise<{ access_token: string, refresh_token: string }>} - A promise that resolves to an object containing the generated access token and refresh token.
 *
 * @throws {Error} - Throws an error if there is an issue updating the user's refresh token in the database.
 */
  async generateTokens(user: User) {
    const payload = { email: user.email, sub: user.id, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      secret: jwtConstants.secret,
      expiresIn: jwtConstants.accessTokenExpiration,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: jwtConstants.refreshSecret,
      expiresIn: jwtConstants.refreshTokenExpiration,
    });

    await this.usersRepository.update(user.id, { refreshToken });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

}
