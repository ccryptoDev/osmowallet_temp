import { Test, TestingModule } from '@nestjs/testing';
import { SendGloballyController } from './send-globally.controller';

describe('SendGloballyController', () => {
  let controller: SendGloballyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SendGloballyController],
    }).compile();

    controller = module.get<SendGloballyController>(SendGloballyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
