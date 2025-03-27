import {
    Controller,
    Body,
    Get,
    Post,
    HttpCode,
    HttpStatus,
    Request,
    UseGuards,
    Put,
    Patch,
    Param,
    Delete,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { AuthGuard } from '../auth/auth.guard';
import { ReviewRetro } from './review.service';



@Controller('review')
export class ReviewController {
    constructor(private reviewservice: ReviewService) { }

    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.CREATED)
    @Post('create')
    async create(
        @Body() data: { restrauntId: number, review: string },
        @Request() req) {
        const transformedData = {
            restraunt: {
                connect: { id: data.restrauntId },
            },
            user: {
                connect: { id: req.user.sub },
            },
            review: data.review,
        };
        return this.reviewservice.createReview(transformedData);
    }

    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    @Patch('update')

    async update(
        @Body() data: { id: number, review: string },
        @Request() req
    ) {
        return this.reviewservice.updateReview({
            where: { id: data.id },
            data: {
                userId: req.user.sub,
                review: data.review,
            },
        });

    }
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    @Delete('delete')
    async delete(
        @Body() data: { id: number },
        @Request() req
    ) {
        return this.reviewservice.deleteReview({
            where: { id: data.id },
            data: {
                userId: req.user.sub,
            },
        });
    }

    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    @Get('getall')
    async getAll(
        @Request() req
    ): Promise<ReviewRetro[]> {
        return this.reviewservice.getReviewByUserId({ id: req.user.sub });
    }



}
