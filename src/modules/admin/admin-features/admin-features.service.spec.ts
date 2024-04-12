import { Test, TestingModule } from '@nestjs/testing';
import { AdminFeaturesService } from './admin-features.service';

describe('AdminFeaturesService', () => {
  let service: AdminFeaturesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminFeaturesService],
    }).compile();

    service = module.get<AdminFeaturesService>(AdminFeaturesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
