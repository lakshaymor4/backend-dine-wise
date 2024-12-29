import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { User, Restraunt, Prisma } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

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
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        const payload = { sub: user.id, username: user.name };
        return { access_token: await this.jwtService.signAsync(payload) };
      } else {
        throw new UnauthorizedException();
      }
    }
  }

  async signUp(data: Prisma.UserCreateInput): Promise<User> {
    const email = this.prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (!email) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      return this.prisma.user.create({
        data: {
          ...data,
          password: hashedPassword,
        },
      });
    } else {
      throw new UnauthorizedException();
    }
  }
}
