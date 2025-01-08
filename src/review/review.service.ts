import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { User, Restraunt, Prisma, Review } from '@prisma/client';
import { ExceptionsHandler } from '@nestjs/core/exceptions/exceptions-handler';
import axios from 'axios';

interface ReviewResponse {
  id: number,
  positive: number,
  negative: number,
  neutral: number,
}


@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) { }



  async getReviewByUserId(params: { id: number }): Promise<Review[]> {
    const { id } = params;
    return this.prisma.review.findMany({
      where: {
        userId: id,
      }
    });
  }

  async createReview(data: Prisma.ReviewCreateInput): Promise<Review> {
    try {

      const restrauntId = data.restraunt.connect?.id;

      if (!restrauntId) {
        throw new Error('Invalid restaurant ID');
      }

      const restraunt = await this.prisma.restraunt.findUnique({
        where: { id: restrauntId },
      });

      if (!restraunt) {
        throw new Error('Restaurant not found');
      }

      const countReview = await this.prisma.review.count({ where: { userId: data.user.connect?.id } });
      if (countReview >= 1) {
        throw new HttpException('User Review Limit For The Restraunt Reached', HttpStatus.FORBIDDEN);
      }

      ;

      if (restraunt.ownerId !== data.user.connect?.id) {
        const sentimentResponse = await this.getSentiment({ review: data.review });
        const sentimentScore = await this.updateSentimentScore({ where: { id: restrauntId }, data: { sentiment: sentimentResponse.sentiment, restraunt } });


        return this.prisma.review.create({
          data,
        });
      } else {
        throw new Error('Action Not Allowed');
      }
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


  async updateReview(params: {
    where: Prisma.ReviewWhereUniqueInput;
    data: { userId: number, review: string };
  }): Promise<Review> {
    const { data, where } = params;
    const findReview = await this.prisma.review.findUnique({
      where,
    });
    if (findReview.userId !== data.userId) {
      throw new UnauthorizedException;
    }
    return this.prisma.review.update({
      data: {
        review: data.review,
      },
      where,
    });
  }

  async deleteReview(params: { where: Prisma.ReviewWhereUniqueInput; data: { userId: number } }): Promise<{ success: boolean }> {
    const { where, data } = params;
    const findReview = await this.prisma.review.findUnique({
      where,
    });
    if (findReview.userId !== data.userId) {
      throw new UnauthorizedException;
    }
    const delReview = await this.prisma.review.delete({
      where,
    });

    if (delReview) {
      return { success: true };
    }
    else {
      throw new ExceptionsHandler
    }
  }


  async getSentiment(data: { review: string }): Promise<{ sentiment: string }> {
    try {
      const sentimentResponse = await axios.post("url", { data: data.review });
      return { sentiment: sentimentResponse.data.sentiment };
    }
    catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateSentimentScore(params: { where: Prisma.RestrauntWhereUniqueInput, data: { sentiment: String, restraunt: any } }): Promise<ReviewResponse> {

    const { data, where } = params;
    const sentimentUpdate = {
      positive: data.sentiment === 'positive' ? data.restraunt.positive + 1 : data.restraunt.positive,
      negative: data.sentiment === 'negative' ? data.restraunt.negative + 1 : data.restraunt.negative,
      neutral: data.sentiment === 'neutral' ? data.restraunt.neutral + 1 : data.restraunt.neutral,
    };
    const updateRestraunt = await this.prisma.restraunt.update({
      data: sentimentUpdate,
      where,
    });
    if (updateRestraunt) {
      return { id: updateRestraunt.id, positive: updateRestraunt.positive, negative: updateRestraunt.negative, neutral: updateRestraunt.neutral };
    }




  }
}
