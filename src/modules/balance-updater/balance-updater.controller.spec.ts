import { Test, TestingModule } from '@nestjs/testing';
import { BalanceUpdaterController } from './balance-updater.controller';

describe('BalanceUpdaterController', () => {
  let controller: BalanceUpdaterController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BalanceUpdaterController],
    }).compile();

    controller = module.get<BalanceUpdaterController>(BalanceUpdaterController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
