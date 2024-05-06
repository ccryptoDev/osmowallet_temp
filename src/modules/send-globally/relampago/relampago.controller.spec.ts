import { Test, TestingModule } from '@nestjs/testing';
import { RelampagoController } from './relampago.controller';

describe('RelampagoController', () => {
  let controller: RelampagoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RelampagoController],
    }).compile();

    controller = module.get<RelampagoController>(RelampagoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
