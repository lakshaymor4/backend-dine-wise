import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { User, Restraunt, Prisma } from '@prisma/client';
import { CacheService } from '../cache/cache.service';

interface RestrauntResponse {
    id: number;
    success: boolean;
}

interface RestrauntGetAllResponse {
    id: number;
    name: string;
    address: string;
    status: boolean;
    reviews: any[];  // Consider creating a proper Review interface
    positive: number;
    negative: number;
}

interface RestrauntResp {
    id: number,
    name: string,
    address: string,
    positive: number,
    negative: number,
    neutral: number,
    status: boolean,

}

@Injectable()
export class RestroService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly redisService: CacheService
    ) { }

    async createRestraunt(data: Prisma.RestrauntCreateInput): Promise<RestrauntResponse> {
        try {
            const ownerId = data.owner.connect?.id;
            if (!ownerId) {
                throw new UnauthorizedException('Owner ID is required');
            }

            const owner = await this.prisma.user.findUnique({
                where: { id: ownerId }
            });

            if (!owner) {
                throw new UnauthorizedException('Owner not found');
            }

            const restrauntCreate = await this.prisma.restraunt.create({ data });

            const MAX_RETRIES = 3;
            for (let i = 0; i < MAX_RETRIES; i++) {
                const wasSuccessful = await this.redisService.addToSortedSetWithRetry(
                    'score',
                    0,
                    restrauntCreate.id.toString()
                );

                if (wasSuccessful) {
                    break;
                }

                if (i === MAX_RETRIES - 1) {
                    // Consider logging this error or handling it differently
                    console.error('Failed to add restraunt to Redis after maximum retries');
                }
            }

            return {
                id: restrauntCreate.id,
                success: true
            };
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            throw new Error(`Error creating restraunt: ${error.message}`);
        }
    }

    async updateRestraunt(params: {
        where: Prisma.RestrauntWhereUniqueInput;
        data: Prisma.RestrauntUpdateInput;
    }): Promise<Restraunt> {
        try {
            const { data, where } = params;
            const ownerId = data.owner.connect?.id;

            const restraunt = await this.prisma.restraunt.findUnique({
                where
            })


            if (!restraunt) {
                throw new NotFoundException('Restraunt not found');
            }
            if (restraunt.ownerId != ownerId) {
                throw new UnauthorizedException("You can only update your restraunt")
            }

            const updatedData = await this.prisma.restraunt.update({
                data,
                where
            });
            if (updatedData.status === false) {
                await this.redisService.removeFromSortedSet('score', restraunt.id.toString());
            }
            if (updatedData.status == true) {
                const isThere = await this.redisService.getKey('score', restraunt.id.toString());
                if (isThere == null) {
                    const restro = await this.prisma.restraunt.findUnique({ where: { id: restraunt.id } });
                    const score = restro.positive * 1 + restro.negative * (-1) + restro.neutral * 0;
                    await this.redisService.addToSortedSetWithRetry('score', score, restraunt.id.toString());
                }
            }
            return updatedData;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new Error(`Error updating restraunt: ${error.message}`);
        }
    }

    async getAllRestrauntsByOwnerId(data: { ownerId: number }): Promise<RestrauntGetAllResponse[]> {
        try {
            const restraunts = await this.prisma.restraunt.findMany({
                where: {
                    ownerId: data.ownerId
                },
                select: {
                    id: true,
                    name: true,
                    address: true,
                    status: true,
                    positive: true,
                    negative: true,
                    reviews: true,
                }
            });

            if (!restraunts.length) {
                return [];
            }

            return restraunts;
        } catch (error) {
            throw new Error(`Error fetching restraunts: ${error.message}`);
        }
    }

    async getRestrauntById(data: { restrauntId: number }): Promise<Restraunt> {
        try {
            const restraunt = await this.prisma.restraunt.findUnique({
                where: { id: data.restrauntId }
            });

            if (!restraunt) {
                throw new NotFoundException('Restraunt not found');
            }

            return restraunt;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new Error(`Error fetching restraunt: ${error.message}`);
        }
    }

    async getAllRestraunts(): Promise<RestrauntResp[]> {
        try {
            const restraunts = await this.prisma.restraunt.findMany({
                select: {
                    id: true,
                    name: true,
                    address: true,
                    positive: true,
                    negative: true,
                    neutral: true,
                    status: true,
                }
            });
            if (!restraunts.length) {
                return null;
            }
            for (let i = 0; i < restraunts.length; i++) {
                const reviews = await this.prisma.review.findMany({ where: { restrauntId: restraunts[i].id }, select: { id: true, review: true, createdAt: true, userId: true } });
                restraunts[i]['reviews'] = reviews;
            }
            return restraunts;
        } catch (error) {
            throw new Error(`Error fetching restraunts: ${error.message}`);
        }
    }
}

export { RestrauntResponse, RestrauntGetAllResponse, RestrauntResp };