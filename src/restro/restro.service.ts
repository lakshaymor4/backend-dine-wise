import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { User, Restraunt, Prisma } from '@prisma/client';
import { ExceptionsHandler } from '@nestjs/core/exceptions/exceptions-handler';

interface RestrauntResponse {
    id: number;
    success: boolean;
}

interface RestrauntGetAllResponse {
    id: number;
    name: string;
    address: string;
    status: boolean;
    reviews: any;
    positive: number;
    negative: number;

}


@Injectable()
export class RestroService {
    constructor(private prisma: PrismaService) { }

    async createRestraunt(data: Prisma.RestrauntCreateInput): Promise<RestrauntResponse> {
        try {
            const id = data.owner.connect?.id;
            const owner = await this.prisma.user.findUnique({
                where: { id }

            });
            if (owner) {
                const restrauntCreate = await this.prisma.restraunt.create({ data });
                if (restrauntCreate) {
                    return { id: restrauntCreate.id, success: true };
                }
                throw new ExceptionsHandler();
            } else {
                throw new UnauthorizedException();
            }
        } catch (error) {
            throw new Error(`Error creating restaurant: ${error.message}`);
        }

    }

    async updateRestraunt(params: {
        where: Prisma.RestrauntWhereUniqueInput,
        data: Prisma.RestrauntUpdateInput
    }): Promise<Restraunt> {
        try {
            const { data, where } = params;
            return await this.prisma.restraunt.update({
                data,
                where
            })

        }
        catch {
            throw new ExceptionsHandler();
        }
    }

    async getAllRestrauntsByOwnerId(data: { ownerId: number }): Promise<RestrauntGetAllResponse[]> {
        return await this.prisma.restraunt.findMany({
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

        })
    }

    async getRestrauntById(data: { restrauntId: number }): Promise<Restraunt> {
        return await this.prisma.restraunt.findUnique({ where: { id: data.restrauntId } });

    }


}

export { RestrauntResponse, RestrauntGetAllResponse };



