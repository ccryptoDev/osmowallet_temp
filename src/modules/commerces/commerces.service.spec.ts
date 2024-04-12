import { Test, TestingModule } from '@nestjs/testing';
import { CommercesService } from './commerces.service';

describe('CommercesService', () => {
  let service: CommercesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommercesService],
    }).compile();

    service = module.get<CommercesService>(CommercesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
