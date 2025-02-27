import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/user.entity';
import { jwtConstants } from './constants';
import { Role } from 'src/Users/role.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

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
    const newUser = this.usersRepository.create({
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
   * @description Authenticates the user and generates JWT access and refresh tokens.
   *
   * @param {any} user - The user object containing credentials and other details.
   *
   * @throws {UnauthorizedException} - If token generation fails.
   *
   * @returns {Promise<{ access_token: string, refresh_token: string }>} - The generated access and refresh tokens.
   */
  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    try {
      const accessToken = this.jwtService.sign(payload, {
        secret: jwtConstants.secret,
        expiresIn: jwtConstants.accessTokenExpiration,
      });
      const refreshToken = this.jwtService.sign(payload, {
        secret: jwtConstants.refreshSecret,
        expiresIn: jwtConstants.refreshTokenExpiration,
      });
      return { access_token: accessToken, refresh_token: refreshToken };
    } catch (error) {
      console.error('Token generation failed:', error); // Debugging
      throw new UnauthorizedException('Failed to generate tokens');
    }
  }

  /**
   * @method refreshToken
   * @description Refreshes authentication tokens using a valid refresh token.
   *
   * @param {string} token - The refresh token provided by the client.
   *
   * @throws {UnauthorizedException} - If the refresh token is invalid or expired.
   *
   * @returns {Promise<{ access_token: string, refresh_token: string }>} - A new pair of access and refresh tokens.
   */
  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: jwtConstants.refreshSecret,
      });
      return this.login(payload);
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
