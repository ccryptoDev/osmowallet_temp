import { Test, TestingModule } from '@nestjs/testing';
import { BalanceUpdaterService } from './balance-updater.service';

describe('BalanceUpdaterService', () => {
  let service: BalanceUpdaterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BalanceUpdaterService],
    }).compile();

    service = module.get<BalanceUpdaterService>(BalanceUpdaterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
