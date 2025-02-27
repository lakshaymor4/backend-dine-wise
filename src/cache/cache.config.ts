import { RedisModuleOptions } from '@nestjs-modules/ioredis';


export const redisConfig: RedisModuleOptions = {
    type: 'single',
    url: process.env.REDIS_URI,
    options: {
        retryStrategy(times) {
            return Math.min(times * 50, 2000);
        }
    }
};