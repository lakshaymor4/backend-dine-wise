import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { User, Restraunt, Prisma, Review } from '@prisma/client';

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  async getReviews(params: { id: number }): Promise<Review[]> {
    const { id } = params;
    return this.prisma.review.findMany({
      where:{
      restrauntId: id,
      }
    });
  }

  async getReviewByUserId(params: { id: number }): Promise<Review[]> {
    const { id } = params;
    return this.prisma.review.findMany({
      where:{
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
