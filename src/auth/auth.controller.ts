import { Body, Controller, Post, UseGuards, Req, UnauthorizedException, Get } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto } from './login.dto';
import { SignupDto } from './signup.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  /**
   * @method signup
   * @description Handles user registration by creating a new account in the system.
   *
   * @param {SignupDto} signupDto - Data Transfer Object containing user details:
   *   - email: User's email address (must be unique).
   *   - password: Secure password for authentication.
   *   - firstName: User's first name.
   *   - lastName: User's last name.
   *
   * @returns {Promise<any>} Success message or an error if registration fails.
   *
   * @example
   * // Request
   * POST /auth/signup
   * {
   *   "email": "user@example.com",
   *   "password": "securepassword",
   *   "firstName": "John",
   *   "lastName": "Doe"
   * }
   *
   * // Response (Success)
   * {
   *   "message": "User registered successfully"
   * }
   */
  @Post('signup')
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(
      signupDto.email,
      signupDto.password,
      signupDto.firstName,
      signupDto.lastName,
    );
  }

  /**
   * @method login
   * @description Authenticates a user with their credentials and returns an access token.
   *
   * @param {LoginDto} loginDto - DTO containing login credentials:
   *   - email: Registered user email.
   *   - password: User's password.
   *
   * @returns {Promise<{ access_token: string }>} JSON object with the JWT access token.
   *
   * @example
   * // Request
   * POST /auth/login
   * {
   *   "email": "user@example.com",
   *   "password": "securepassword"
   * }
   *
   * // Response (Success)
   * {
   *   "access_token": "your_jwt_token"
   * }
   */
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * @method refresh
   * @description Generates a new access token using a valid refresh token from the Authorization header.
   *
   * @param {Request} request - Incoming HTTP request containing the Authorization header.
   *
   * @throws {UnauthorizedException} If the Authorization header is missing or incorrectly formatted.
   *
   * @returns {Promise<{ access_token: string, refresh_token: string }>} New access token and refresh token.
   *
   * @example
   * // Request
   * POST /auth/refresh
   * Headers:
   *   Authorization: Bearer your_refresh_token
   *
   * // Response (Success)
   * {
   *   "access_token": "new_jwt_token",
   *   "refresh_token": "new_refresh_token"
   * }
   */
  @Post('refresh')
  async refresh(@Req() request: Request) {
    // Extract the token from the Authorization header
    const authHeader = request.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid authorization header');
    }
    const refreshToken = authHeader.split(' ')[1]; // Get the token after "Bearer "
    return this.authService.refreshToken(refreshToken);
  }

  /**
  * @method getMe
  * @description Retrieves the profile of the authenticated user.
  * @param {Request} req - The request object containing user details from the JWT.
  * @returns {Promise<{ id: number, firstName: string, lastName: string, email: string, role: string }>}  
  *          A promise resolving to the authenticated user's profile details.
  * @throws {UnauthorizedException} If the user is not authenticated or the token is invalid.
  */
  @Get('self')
  @UseGuards(AuthGuard('jwt'))
  async getMe(@Req() req) {
      if (!req.user || !req.user.id) {
          throw new UnauthorizedException('Invalid token or user data missing');
      }
      
      const userId = req.user.id;
      return this.authService.getUserProfile(userId);
  }  

}
