import { Test, TestingModule } from '@nestjs/testing';
import { RestroService } from './restro.service';

describe('RestroService', () => {
  let service: RestroService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RestroService],
    }).compile();

    service = module.get<RestroService>(RestroService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
