import { Test, TestingModule } from '@nestjs/testing';
import { OnvoService } from './onvo.service';

describe('OnvoService', () => {
  let service: OnvoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OnvoService],
    }).compile();

    service = module.get<OnvoService>(OnvoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
