import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ReviewModule } from './review/review.module';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { PrismaModuleModule } from './prisma-module/prisma-module.module';
import { RestroModule } from './restro/restro.module';

console.log(ConfigModule.forRoot());

@Module({
  imports: [ReviewModule, ConfigModule.forRoot(), AuthModule, PrismaModuleModule, RestroModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
