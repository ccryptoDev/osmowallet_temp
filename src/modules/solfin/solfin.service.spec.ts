import { Test, TestingModule } from '@nestjs/testing';
import { SolfinService } from './solfin.service';

describe('SolfinService', () => {
  let service: SolfinService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SolfinService],
    }).compile();

    service = module.get<SolfinService>(SolfinService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
