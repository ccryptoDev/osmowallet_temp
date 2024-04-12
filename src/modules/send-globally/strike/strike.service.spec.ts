import { Test, TestingModule } from '@nestjs/testing';
import { StrikeService } from './strike.service';

describe('StrikeService', () => {
  let service: StrikeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StrikeService],
    }).compile();

    service = module.get<StrikeService>(StrikeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
