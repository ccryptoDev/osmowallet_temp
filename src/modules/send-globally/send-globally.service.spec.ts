import { Test, TestingModule } from '@nestjs/testing';
import { SendGloballyService } from './send-globally.service';

describe('SendGloballyService', () => {
  let service: SendGloballyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SendGloballyService],
    }).compile();

    service = module.get<SendGloballyService>(SendGloballyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
