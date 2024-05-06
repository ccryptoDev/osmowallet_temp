import { Test, TestingModule } from '@nestjs/testing';
import { AdminMeController } from './admin-me.controller';

describe('AdminMeController', () => {
  let controller: AdminMeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminMeController],
    }).compile();

    controller = module.get<AdminMeController>(AdminMeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
