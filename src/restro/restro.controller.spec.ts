import { Test, TestingModule } from '@nestjs/testing';
import { RestroController } from './restro.controller';

describe('RestroController', () => {
  let controller: RestroController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RestroController],
    }).compile();

    controller = module.get<RestroController>(RestroController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
