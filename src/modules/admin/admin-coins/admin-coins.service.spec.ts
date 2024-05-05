import { Test, TestingModule } from '@nestjs/testing';
import { AdminCoinsService } from './admin-coins.service';

describe('AdminCoinsService', () => {
  let service: AdminCoinsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminCoinsService],
    }).compile();

    service = module.get<AdminCoinsService>(AdminCoinsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
