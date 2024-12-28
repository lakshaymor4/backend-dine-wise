import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { User, Restraunt, Prisma, Review } from '@prisma/client';

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  async getReviews(params: { restrauntId: Number }): Promise<Review[]> {
    const { restrauntId } = params;
    return this.prisma.review.findMany({
      restrauntId: restrauntId,
    });
  }

  async getReviewByUserId(params: { userId: Number }): Promise<Review[]> {
    const { userId } = params;
    return this.prisma.review.findMany({
      userId: userId,
    });
  }

  async createReview(data: Prisma.ReviewCreateInput): Promise<Review> {
    const restraunt = this.prisma.restraunt.findUnique({
      where: { id: data.restrauntId },
    });
    if (restraunt && restraunt.ownerId != data.userId) {
      return this.prisma.review.create({
        data,
      });
    } else {
      throw new Error('Action Not Allowed');
    }
  }
  async updateReview(params: {
    where: Prisma.ReviewWhereUniqueInput;
    data: Prisma.ReviewUpdateInput;
  }): Promise<Review> {
    const { data, where } = params;
    return this.prisma.review.update({
      data,
      where,
    });
  }

  async deleteReview(where: Prisma.ReviewWhereUniqueInput): Promise<Review> {
    return this.prisma.review.delete({
      where,
    });
  }
}
