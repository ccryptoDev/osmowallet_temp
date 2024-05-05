import { Test, TestingModule } from '@nestjs/testing';
import { EmailableService } from './emailable.service';

describe('EmailableService', () => {
  let service: EmailableService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailableService],
    }).compile();

    service = module.get<EmailableService>(EmailableService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
