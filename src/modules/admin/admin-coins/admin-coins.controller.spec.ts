import { Test, TestingModule } from '@nestjs/testing';
import { AdminCoinsController } from './admin-coins.controller';

describe('AdminCoinsController', () => {
  let controller: AdminCoinsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminCoinsController],
    }).compile();

    controller = module.get<AdminCoinsController>(AdminCoinsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
