import { Test, TestingModule } from '@nestjs/testing';
import { AdminTransactionsService } from './admin-transactions.service';

describe('AdminTransactionsService', () => {
  let service: AdminTransactionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminTransactionsService],
    }).compile();

    service = module.get<AdminTransactionsService>(AdminTransactionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
