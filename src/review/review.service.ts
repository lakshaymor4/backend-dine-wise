import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
  NotFoundException,
  InternalServerErrorException
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Prisma, Review } from '@prisma/client';
import axios from 'axios';
import { CacheService } from 'src/cache/cache.service';

interface ReviewResponse {
  id: number;
  positive: number;
  negative: number;
  neutral: number;
  success: boolean;
}
interface ReviewRetro {
  id: number;
  name: string;
  userId: number;
  restrauntId: number;
  review: string;
  createdAt: string;
  updatedAt: string;

}

@Injectable()
export class ReviewService {
  constructor(
    private prisma: PrismaService,
    private readonly redisService: CacheService,
  ) { }

  async getReviewByUserId(params: { id: number }): Promise<ReviewRetro[]> {
    const { id } = params;
    const reviews = await this.prisma.review.findMany({
      where: { userId: id },
      select: {
        id: true,
        userId: true,
        restrauntId: true,
        review: true,
        createdAt: true,
        updatedAt: true

      }
    });
    const reviewsWithNames = await Promise.all(reviews.map(async (review) => {
      const restraunt = await this.prisma.restraunt.findUnique({ where: { id: review.restrauntId } });
      return {
        ...review,
        name: restraunt.name,
        createdAt: review.createdAt.toISOString(),
        updatedAt: review.updatedAt.toISOString()
      };
    }));
    return reviewsWithNames;
  }

  async createReview(data: Prisma.ReviewCreateInput): Promise<Review> {
    try {
      const restrauntId = data.restraunt.connect?.id;
      const userId = data.user.connect?.id;

      if (!restrauntId || !userId) {
        throw new HttpException(
          'Invalid user or restaurant ID',
          HttpStatus.BAD_REQUEST,
        );
      }

      const restraunt = await this.prisma.restraunt.findUnique({
        where: { id: restrauntId },
      });

      if (!restraunt) {
        throw new HttpException('Restaurant not found', HttpStatus.NOT_FOUND);
      }

      const existingReview = await this.prisma.review.findFirst({
        where: { userId, restrauntId },
      });

      if (existingReview) {
        throw new HttpException(
          'User Review Limit For The Restaurant Reached',
          HttpStatus.FORBIDDEN,
        );
      }

      if (restraunt.ownerId === userId) {
        throw new HttpException(
          'Action Not Allowed',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const sentimentResponse = await this.getSentiment({ review: data.review });
      const sentimentScore = await this.updateSentimentScore({
        where: { id: restrauntId },
        data: { sentiment: sentimentResponse.sentiment, restraunt },
      });

      if (sentimentScore.success) {
        return this.prisma.review.create({ data });
      } else {
        throw new HttpException(
          'Failed to update sentiment score',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateReview(params: {
    where: Prisma.ReviewWhereUniqueInput;
    data: { userId: number; review: string };
  }): Promise<Review> {
    try {
      const { where, data } = params;

      // Find and validate the review
      const findReview = await this.prisma.review.findUnique({ where });
      if (!findReview || findReview.userId !== data.userId) {
        throw new UnauthorizedException('Unauthorized action');
      }

      // Find and validate the restaurant
      const restaurant = await this.prisma.restraunt.findUnique({
        where: { id: findReview.restrauntId },
      });
      if (!restaurant) {
        throw new NotFoundException('Restaurant not found');
      }

      // Get sentiments for both old and new reviews
      const [originalSentiment, newSentiment] = await Promise.all([
        this.getSentiment({ review: findReview.review }),
        this.getSentiment({ review: data.review })
      ]);

      // Calculate sentiment updates by removing old sentiment and adding new sentiment
      const sentimentUpdate = {
        positive: restaurant.positive +
          (originalSentiment.sentiment === 'positive' ? -1 : 0) +
          (newSentiment.sentiment === 'positive' ? 1 : 0),
        negative: restaurant.negative +
          (originalSentiment.sentiment === 'negative' ? -1 : 0) +
          (newSentiment.sentiment === 'negative' ? 1 : 0),
        neutral: restaurant.neutral +
          (originalSentiment.sentiment === 'neutral' ? -1 : 0) +
          (newSentiment.sentiment === 'neutral' ? 1 : 0),
      };

      // Use a transaction to ensure data consistency
      return await this.prisma.$transaction(async (prismaClient) => {
        // Update restaurant sentiment counts
        const updatedRestaurant = await prismaClient.restraunt.update({
          data: sentimentUpdate,
          where: { id: findReview.restrauntId },
        });

        // Calculate new normalized score
        const total = updatedRestaurant.positive + updatedRestaurant.negative + updatedRestaurant.neutral;
        if (total === 0) {
          await this.redisService.addToSortedSetWithRetry(
            'score',
            0,
            updatedRestaurant.id.toString()
          );
          return prismaClient.review.update({
            data: { review: data.review },
            where,
          });
        }

        // Calculate normalized score (-1 to 1 range)
        const score = (
          updatedRestaurant.positive * 1 +
          updatedRestaurant.negative * -1 +
          updatedRestaurant.neutral * 0
        ) / total;

        // Update Redis score
        const wasSuccessful = await this.redisService.addToSortedSetWithRetry(
          'score',
          score,
          updatedRestaurant.id.toString()
        );

        if (!wasSuccessful) {
          throw new Error('Failed to update Redis score');
        }

        // Update the review text
        return prismaClient.review.update({
          data: { review: data.review },
          where,
        });
      });

    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        error.message || 'Failed to update review'
      );
    }
  }
  async deleteReview(params: {
    where: Prisma.ReviewWhereUniqueInput;
    data: { userId: number };
  }): Promise<{ success: boolean }> {
    const { where, data } = params;

    try {
      // Use a transaction to ensure data consistency
      return await this.prisma.$transaction(async (prismaClient) => {
        // Find the review
        const review = await prismaClient.review.findUnique({ where });
        if (!review || review.userId !== data.userId) {
          throw new UnauthorizedException('Unauthorized action');
        }

        // Find the restaurant
        const restaurant = await prismaClient.restraunt.findUnique({
          where: { id: review.restrauntId },
        });
        if (!restaurant) {
          throw new NotFoundException('Restaurant not found');
        }

        // Get sentiment analysis
        const sentimentResponse = await this.getSentiment({ review: review.review });

        // Calculate sentiment updates
        const sentimentUpdate = {
          positive: sentimentResponse.sentiment === 'positive'
            ? Math.max(0, restaurant.positive - 1)
            : restaurant.positive,
          negative: sentimentResponse.sentiment === 'negative'
            ? Math.max(0, restaurant.negative - 1)
            : restaurant.negative,
          neutral: sentimentResponse.sentiment === 'neutral'
            ? Math.max(0, restaurant.neutral - 1)
            : restaurant.neutral,
        };

        // Delete the review first
        await prismaClient.review.delete({ where });

        // Update restaurant sentiment counts
        const updatedRestaurant = await prismaClient.restraunt.update({
          data: sentimentUpdate,
          where: { id: review.restrauntId },
        });

        // Calculate normalized score
        const total = updatedRestaurant.positive + updatedRestaurant.negative + updatedRestaurant.neutral;
        console.log(total)
        if (total === 0) {
          console.log("inn")
          // If total is 0, set score to 0 instead of throwing error
          await this.redisService.addToSortedSetWithRetry(
            'score',
            0,
            updatedRestaurant.id.toString()
          );
          return { success: true };
        }
        console.log("out")

        const score = (
          updatedRestaurant.positive * -1 +
          updatedRestaurant.negative * +1 +
          updatedRestaurant.neutral * 0
        ) / total;

        // Update Redis score
        const wasSuccessful = await this.redisService.addToSortedSetWithRetry(
          'score',
          score,
          updatedRestaurant.id.toString()
        );

        if (!wasSuccessful) {
          throw new Error('Failed to update Redis score');
        }

        return { success: true };
      });

    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        error.message || 'Failed to delete review'
      );
    }
  }

  async getSentiment(data: { review: string }): Promise<{ sentiment: string }> {
    try {
      const sentimentResponse = await axios.post(process.env.sentimentUri + '/predict', {
        data: data.review,
      });
      return { sentiment: sentimentResponse.data.sentiment };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateSentimentScore(params: {
    where: Prisma.RestrauntWhereUniqueInput;
    data: { sentiment: string; restraunt: any };
  }): Promise<ReviewResponse> {
    try {
      const { data, where } = params;
      const sentimentUpdate = {
        positive:
          data.sentiment === 'positive' ? data.restraunt.positive + 1 : data.restraunt.positive,
        negative:
          data.sentiment === 'negative' ? data.restraunt.negative + 1 : data.restraunt.negative,
        neutral:
          data.sentiment === 'neutral' ? data.restraunt.neutral + 1 : data.restraunt.neutral,
      };

      const updatedRestraunt = await this.prisma.restraunt.update({
        data: sentimentUpdate,
        where,
      });

      const total = updatedRestraunt.positive + updatedRestraunt.negative + updatedRestraunt.neutral;
      if (total === 0) {
        throw new Error('Cannot normalize sentiment score for zero counts.');
      }

      const score =
        updatedRestraunt.positive * 1 +
        updatedRestraunt.negative * -1 +
        updatedRestraunt.neutral * 0;
      const normalisedScore = score / total;

      const wasSuccessful = await this.redisService.addToSortedSetWithRetry(
        'score',
        normalisedScore,
        updatedRestraunt.id.toString(),
      );

      if (!wasSuccessful) {
        // Rollback the update
        await this.prisma.restraunt.update({
          data: {
            positive:
              data.sentiment === 'positive' ? Math.max(0, sentimentUpdate.positive - 1) : sentimentUpdate.positive,
            negative:
              data.sentiment === 'negative' ? Math.max(0, sentimentUpdate.negative - 1) : sentimentUpdate.negative,
            neutral:
              data.sentiment === 'neutral' ? Math.max(0, sentimentUpdate.neutral - 1) : sentimentUpdate.neutral,
          },
          where,
        });

        return { ...updatedRestraunt, success: false };
      }

      return { ...updatedRestraunt, success: true };
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

export { ReviewRetro }