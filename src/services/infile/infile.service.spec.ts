import { Test, TestingModule } from '@nestjs/testing';
import { InfileService } from './infile.service';

describe('InfileService', () => {
  let service: InfileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InfileService],
    }).compile();

    service = module.get<InfileService>(InfileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
