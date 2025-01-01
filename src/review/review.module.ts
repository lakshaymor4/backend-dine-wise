import { Module } from '@nestjs/common';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModuleModule } from 'src/prisma-module/prisma-module.module';

@Module({
  imports:[PrismaModuleModule],
  controllers: [ReviewController],
  providers: [ReviewService],
  exports: [ReviewService],
})
export class ReviewModule {}
