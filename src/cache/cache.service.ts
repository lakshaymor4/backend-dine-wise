import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';

@Injectable()
export class CacheService {
    private readonly logger = new Logger(CacheService.name);

    constructor(@InjectRedis() private readonly redis: Redis) { }

    async getKey(key: string, member: string): Promise<Number> {
        return await this.redis.zrank(key, member);

    }

    async addToSortedSetWithRetry(
        key: string,
        score: number,
        member: string,
        maxRetries = 3,
    ): Promise<boolean> {
        let attempt = 0;
        let success = false;

        while (attempt < maxRetries && !success) {
            try {
                // Fixed: correct zadd syntax for IoRedis
                const result = await this.redis.zadd(key, score, member);

                if (result !== null) {
                    this.logger.log(`Successfully added/updated member in Redis on attempt ${attempt + 1}`);
                    success = true;
                    return true;
                } else {
                    this.logger.error(`Unexpected result from zadd: ${result}`);
                }
            } catch (error) {
                this.logger.error(`Attempt ${attempt + 1} failed: ${error.message}`);
            }

            attempt++;
            if (attempt < maxRetries) {
                this.logger.warn(`Retrying operation... (Attempt ${attempt + 1})`);
                // Add a small delay before retrying
                await new Promise(resolve => setTimeout(resolve, 100 * attempt));
            } else {
                this.logger.error('Max retries reached. Operation failed.');
            }
        }

        return false;
    }

    async getRangeFromSortedSet(key: string, start: number, stop: number) {
        try {
            return await this.redis.zrevrange(key, start, stop);
        } catch (error) {
            this.logger.error(`Failed to get range from sorted set: ${error.message}`);
            throw error;
        }
    }

    async removeFromSortedSet(key: string, member: string) {
        try {
            return await this.redis.zrem(key, member);
        } catch (error) {
            this.logger.error(`Failed to remove member from sorted set: ${error.message}`);
            throw error;
        }
    }

    async getScore(key: string, member: string) {
        try {
            return await this.redis.zscore(key, member);
        } catch (error) {
            this.logger.error(`Failed to get score: ${error.message}`);
            throw error;
        }
    }


}