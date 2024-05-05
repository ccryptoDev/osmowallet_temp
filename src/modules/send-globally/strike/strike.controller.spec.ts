import { Test, TestingModule } from '@nestjs/testing';
import { StrikeController } from './strike.controller';

describe('StrikeController', () => {
  let controller: StrikeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StrikeController],
    }).compile();

    controller = module.get<StrikeController>(StrikeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
