import { Module } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardController } from './leaderboard.controller';
import { CacheModule } from '../cache/cache.module';
import { PrismaModuleModule } from 'src/prisma-module/prisma-module.module';

@Module({
  imports: [CacheModule, PrismaModuleModule],
  providers: [LeaderboardService],
  controllers: [LeaderboardController],
  exports: [LeaderboardService]
})
export class LeaderboardModule { }
