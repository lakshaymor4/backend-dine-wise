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
} from '@nestjs/common';
import { RestroService, RestrauntResponse, RestrauntGetAllResponse, RestrauntResp } from './restro.service';

import { AuthGuard } from '../auth/auth.guard';

@Controller('restro')
export class RestroController {
    constructor(private restroService: RestroService) { }

    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.CREATED)
    @Post('create')

    async create(
        @Body() data: { name: string; address: string; },
        @Request() req
    ): Promise<RestrauntResponse> {

        const transformedData = {
            name: data.name,
            address: data.address,
            owner: {
                connect: { id: req.user.sub },
            },
        };

        return this.restroService.createRestraunt(transformedData);
    }

    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    @Patch('update')

    async update(
        @Body() data: { id: number, name: string, address: string, status: boolean },
        @Request() req
    ) {
        const transformedData = {
            where: { id: data.id },
            data: {
                name: data.name,
                address: data.address,
                status: data.status,
                owner: {
                    connect: { id: req.user.sub },
                },
            },
        };
        return this.restroService.updateRestraunt(transformedData);

    }
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    @Get('getall')

    async getAll(
        @Request() req
    ): Promise<RestrauntGetAllResponse[]> {
        return this.restroService.getAllRestrauntsByOwnerId({ ownerId: req.user.sub });
    }
    @HttpCode(HttpStatus.OK)
    @Get('getrestro/:id')

    async getById(
        @Param('id') id: string) {

        return this.restroService.getRestrauntById({ restrauntId: +id })

    }

    @HttpCode(HttpStatus.OK)
    @Get('getallrestro')

    async getAllrestro(
    ): Promise<RestrauntResp[]> {
        return this.restroService.getAllRestraunts();
    }







}
