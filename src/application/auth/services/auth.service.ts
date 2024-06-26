import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { HashService } from '../../utils/services/hash.service';
import { JwtPayload, Tokens } from '../types';
import { UserService } from 'src/application/user/services/user.service';
import { UserRegisterDto } from '../DTOS/common/user-register-dto';
import { UserLogInDto } from '../DTOS/common/user-logIn-dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly hashService: HashService,
  ) {}

  async logIn(userLogInDto: UserLogInDto) {
    const user = await this.userService.findOneByEmail(userLogInDto.email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const isPasswordValid = await this.hashService.compare(
      userLogInDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Incorrect password');
    }

    return await this.getTokens({
      sub: user.id,
    });
  }

  async register(userRegister: UserRegisterDto): Promise<Tokens> {
    await this.validateEmailForSignUp(userRegister.email);

    const hashedPassword = await this.hashService.hash(userRegister.password);

    const user = await this.userService.create({
      email: userRegister.email,
      userName: userRegister.userName,
      password: hashedPassword,
      role: userRegister.role,
    });

    return await this.getTokens({
      sub: user.id,
    });
  }

  async getTokens(jwtPayload: JwtPayload): Promise<Tokens> {
    const secretKey = process.env.JWT_SECRET;
    if (!secretKey) {
      throw new Error('JWT_SECRET is not set');
    }
    const accessTokenOptions = {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m',
    };

    const accessToken = await this.signToken(
      jwtPayload,
      secretKey,
      accessTokenOptions,
    );

    return { access_token: accessToken };
  }

  async signToken(payload: JwtPayload, secretKey: string, options: any) {
    return await this.jwtService.signAsync(payload, {
      secret: secretKey,
      ...options,
    });
  }

  async validateEmailForSignUp(email: string): Promise<boolean | undefined> {
    const user = await this.userService.findOneByEmailRegister(email);

    if (user) {
      throw new HttpException('Email already exists!', 400);
    }
    return true;
  }
}
