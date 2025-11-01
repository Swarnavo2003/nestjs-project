/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorators';
import { UserRole } from './entities/user.entity';
import { RolesGuard } from './guards/roles..guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return await this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @Post('refresh')
  async refreshToken(@Body() refreshToken: string) {
    return await this.authService.refreshToken(refreshToken);
  }

  // protected route
  // current user
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    return await user;
  }

  // protected route
  // create admin
  @Post('create-admin')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async createAdmin(@Body() registerDto: RegisterDto) {
    return await this.authService.createAdmin(registerDto);
  }
}
