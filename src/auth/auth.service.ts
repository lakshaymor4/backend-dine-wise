import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { User, Restraunt, Prisma } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from "argon2";
import { ExceptionsHandler } from '@nestjs/core/exceptions/exceptions-handler';

interface SignUpResponse {
  success: boolean;
  userId?: number;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) { }

  async login(data: {
    email: string;
    password: string;
  }): Promise<{ access_token: string }> {
    const { email, password } = data;
    const user = await this.prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    if (!user) {
      throw new UnauthorizedException();
    } else {
      const match = await argon2.verify(user.password, password);
      if (match) {
        const payload = { sub: user.id, username: user.name };
        const access_token = await this.jwtService.signAsync(payload, {
          secret: process.env.JWT_SECRET,
          expiresIn: '1h',
        });

        return { access_token };
      } else {
        throw new UnauthorizedException();
      }
    }
  }

  async signUp(data: Prisma.UserCreateInput): Promise<SignUpResponse> {
    const email = await this.prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (!email) {
      const hashedPassword = await argon2.hash(data.password);
      data.password = hashedPassword;
      const userCreation = await this.prisma.user.create({
        data
      });

      if (userCreation) {
        return { success: true, userId: userCreation.id };
      } else {
        throw new ExceptionsHandler();
      }

    } else {
      throw new UnauthorizedException();
    }
  }
}

export { SignUpResponse };