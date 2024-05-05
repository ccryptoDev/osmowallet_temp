import { Test, TestingModule } from '@nestjs/testing';
import { SolfinController } from './solfin.controller';

describe('SolfinController', () => {
  let controller: SolfinController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SolfinController],
    }).compile();

    controller = module.get<SolfinController>(SolfinController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
