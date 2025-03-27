import { Module } from '@nestjs/common';
import { RestroService } from './restro.service';
import { RestroController } from './restro.controller';
import { PrismaModuleModule } from '../prisma-module/prisma-module.module';

@Module({
  imports: [PrismaModuleModule],
  providers: [RestroService],
  controllers: [RestroController]
})
export class RestroModule { }
