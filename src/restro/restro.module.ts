import { Module } from '@nestjs/common';
import { RestroService } from './restro.service';
import { RestroController } from './restro.controller';

@Module({
  providers: [RestroService],
  controllers: [RestroController]
})
export class RestroModule {}
