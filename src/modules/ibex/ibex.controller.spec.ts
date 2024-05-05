import { Test, TestingModule } from '@nestjs/testing';
import { IbexController } from './ibex.controller';

describe('IbexController', () => {
  let controller: IbexController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IbexController],
    }).compile();

    controller = module.get<IbexController>(IbexController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
