import {
  Controller,
  Body,
  Get,
  Post,
  HttpCode,
  HttpStatus,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authserivce: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() data: { email: string; password: string }) {
    return this.authserivce.login(data);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('signup')
  async signUp(
    @Body() data: { email: string; password: string; name: string },
  ) {
    return this.authserivce.signUp(data);
  }
}
