import { Module, Global } from '@nestjs/common';
import { RedisModule } from '@nestjs-modules/ioredis';
import { redisConfig } from './cache.config';
import { CacheService } from './cache.service';


@Global()
@Module({
  imports: [
    RedisModule.forRootAsync({
      useFactory: () => redisConfig
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule { }
