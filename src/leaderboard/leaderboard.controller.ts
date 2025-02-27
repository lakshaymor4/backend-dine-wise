import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';

@Controller('leaderboard')
export class LeaderboardController {
    constructor(private readonly leaderboardService: LeaderboardService) { }

    @Get('top')
    async getTopRestaurants(@Query('limit', ParseIntPipe) limit: number = 10) {
        return this.leaderboardService.getTopRestaurants(limit);
    }

    @Get('restaurant/:id')
    async getRestaurantRank(@Param('id') restaurantId: string) {
        return this.leaderboardService.getRestaurantRank(restaurantId);
    }
}