import { Test, TestingModule } from '@nestjs/testing';
import { AdminTransactionsController } from './admin-transactions.controller';

describe('AdminTransactionsController', () => {
  let controller: AdminTransactionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminTransactionsController],
    }).compile();

    controller = module.get<AdminTransactionsController>(AdminTransactionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
