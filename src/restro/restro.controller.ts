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
import { RestroService, RestrauntResponse, RestrauntGetAllResponse } from './restro.service';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('restro')
export class RestroController {
    constructor(private restroService: RestroService) { }

    @HttpCode(HttpStatus.CREATED)
    @Post('create')

    async create(
        @Body() data: { name: string; address: string; owner: number }
    ): Promise<RestrauntResponse> {

        const transformedData = {
            name: data.name,
            address: data.address,
            owner: {
                connect: { id: data.owner },
            },
        };

        return this.restroService.createRestraunt(transformedData);
    }

    @HttpCode(HttpStatus.OK)
    @Patch('update')

    async update(
        @Body() data: { id: number, name: string, address: string, status: boolean }) {
        const transformedData = {
            where: { id: data.id },
            data: {
                name: data.name,
                address: data.address,
                status: data.status,
            },
        };
        return this.restroService.updateRestraunt(transformedData);

    }
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    @Post('getall')

    async getAll(
        @Body() data: { id: number }
    ): Promise<RestrauntGetAllResponse[]> {
        return this.restroService.getAllRestrauntsByOwnerId({ ownerId: data.id });
    }
    @HttpCode(HttpStatus.OK)
    @Get('getrestro/:id')

    async getById(
        @Param('id') id: string) {

        return this.restroService.getRestrauntById({ restrauntId: +id })

    }





}
