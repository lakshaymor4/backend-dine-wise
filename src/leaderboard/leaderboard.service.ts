import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';
import { LeaderboardEntry, LeaderboardEntryId } from './leaderboard.interface';
import { PrismaService } from 'src/prisma.service';
import { Prisma, Review } from '@prisma/client';


@Injectable()
export class LeaderboardService {
    private readonly logger = new Logger(LeaderboardService.name);
    private readonly LEADERBOARD_KEY = 'score';

    constructor(private readonly cacheService: CacheService, private prisma: PrismaService,) { }

    async updateScore(restaurantId: string, score: number): Promise<boolean> {
        try {
            return await this.cacheService.addToSortedSetWithRetry(
                this.LEADERBOARD_KEY,
                score,
                restaurantId
            );
        } catch (error) {
            this.logger.error(`Failed to update leaderboard score: ${error.message}`);
            throw error;
        }
    }

    async getTopRestaurants(limit: number = 10): Promise<LeaderboardEntry[]> {
        try {
            // Get top restaurants (highest scores first)
            const topMembers = await this.cacheService.getRangeFromSortedSet(
                this.LEADERBOARD_KEY,
                0,
                limit - 1
            );

            const leaderboard: LeaderboardEntry[] = [];

            for (let i = 0; i < topMembers.length; i++) {
                const id = topMembers[i];
                const score = await this.cacheService.getScore(this.LEADERBOARD_KEY, id);
                const restro = await this.prisma.restraunt.findUnique({
                    where: { id: +id },
                    select: { name: true, positive: true, negative: true, neutral: true, address: true, }
                });

                leaderboard.push({
                    name: restro.name,
                    address: restro.address,
                    positive: restro.positive,
                    negative: restro.negative,
                    neutral: restro.neutral,
                    score: Number(score),
                    rank: i + 1
                });
            }

            return leaderboard;
        } catch (error) {
            this.logger.error(`Failed to get top restaurants: ${error.message}`);
            throw error;
        }
    }

    async getRestaurantRank(restaurantId: string): Promise<LeaderboardEntryId | null> {
        try {
            const score = await this.cacheService.getScore(this.LEADERBOARD_KEY, restaurantId);

            if (score === null) {
                return null;
            }

            // Get all members with higher scores to determine rank
            const rank = await this.cacheService.getRangeFromSortedSet(
                this.LEADERBOARD_KEY,
                0,
                -1
            );

            const position = rank.indexOf(restaurantId);

            return {
                id: restaurantId,
                score: Number(score),
                rank: position + 1
            };
        } catch (error) {
            this.logger.error(`Failed to get restaurant rank: ${error.message}`);
            throw error;
        }
    }
}