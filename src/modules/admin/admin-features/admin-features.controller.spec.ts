import { Test, TestingModule } from '@nestjs/testing';
import { AdminFeaturesController } from './admin-features.controller';

describe('AdminFeaturesController', () => {
  let controller: AdminFeaturesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminFeaturesController],
    }).compile();

    controller = module.get<AdminFeaturesController>(AdminFeaturesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
