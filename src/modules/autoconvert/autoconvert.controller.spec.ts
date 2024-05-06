import { Test, TestingModule } from '@nestjs/testing';
import { AutoconvertController } from './autoconvert.controller';

describe('AutoconvertController', () => {
  let controller: AutoconvertController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AutoconvertController],
    }).compile();

    controller = module.get<AutoconvertController>(AutoconvertController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
