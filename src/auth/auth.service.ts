/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User, UserRole } from './entities/user.entity';
import { Repository } from 'typeorm';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userRepository.findOne({
      where: {
        email: registerDto.email,
      },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await this.hashPassword(registerDto.password);

    const newlyCreatedUser = this.userRepository.create({
      email: registerDto.email,
      name: registerDto.name,
      password: hashedPassword,
      role: UserRole.USER,
    });

    const savedUser = await this.userRepository.save(newlyCreatedUser);

    const { password, ...result } = savedUser;

    return {
      user: result,
      message: 'Registration Successful. Please Login To Continue',
    };
  }

  async createAdmin(registerDto: RegisterDto) {
    const existingUser = await this.userRepository.findOne({
      where: {
        email: registerDto.email,
      },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await this.hashPassword(registerDto.password);

    const newlyCreatedAdmin = this.userRepository.create({
      email: registerDto.email,
      name: registerDto.name,
      password: hashedPassword,
      role: UserRole.ADMIN,
    });

    const savedAdmin = await this.userRepository.save(newlyCreatedAdmin);

    return {
      user: {
        email: savedAdmin.email,
        name: savedAdmin.name,
        role: savedAdmin.role,
      },
      message: 'Admin Registration Successful. Please Login To Continue',
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: {
        email: loginDto.email,
      },
    });

    if (
      !user ||
      !(await this.verifyPassword(loginDto.password, user.password))
    ) {
      throw new UnauthorizedException('Invalid Credentials');
    }

    // generate the tokens
    const tokens = this.generateTokens(user);

    const { password, ...result } = user;

    return {
      user: result,
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload: { sub: number } = this.jwtService.verify(refreshToken, {
        secret: 'refresh_secret',
      });

      const user = await this.userRepository.findOne({
        where: {
          id: payload.sub,
        },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid Refresh Token');
      }

      const accessToken = this.generateAccessToken(user);

      return {
        accessToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid Refresh Token', error);
    }
  }

  async getUserById(userId: number) {
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { password, ...result } = user;
    return result;
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  private async verifyPassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  private generateTokens(user: User) {
    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user),
    };
  }

  private generateAccessToken(user: User) {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
    };

    return this.jwtService.sign(payload, {
      secret: 'jwt_secret',
      expiresIn: '15m',
    });
  }

  private generateRefreshToken(user: User) {
    const payload = {
      sub: user.id,
    };

    return this.jwtService.sign(payload, {
      secret: 'refresh_secret',
      expiresIn: '7d',
    });
  }
}
