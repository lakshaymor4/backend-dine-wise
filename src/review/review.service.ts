import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { User, Restraunt, Prisma, Review } from '@prisma/client';
import { ExceptionsHandler } from '@nestjs/core/exceptions/exceptions-handler';

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


    if (restraunt.ownerId !== data.user.connect?.id) {
      return this.prisma.review.create({
        data,
      });
    } else {
      throw new Error('Action Not Allowed');
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
}
