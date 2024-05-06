import { Test, TestingModule } from '@nestjs/testing';
import { RelampagoService } from './relampago.service';

describe('RelampagoService', () => {
  let service: RelampagoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RelampagoService],
    }).compile();

    service = module.get<RelampagoService>(RelampagoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
