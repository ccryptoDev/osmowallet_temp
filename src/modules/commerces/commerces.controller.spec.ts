import { Test, TestingModule } from '@nestjs/testing';
import { CommercesController } from './commerces.controller';

describe('CommercesController', () => {
  let controller: CommercesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommercesController],
    }).compile();

    controller = module.get<CommercesController>(CommercesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
