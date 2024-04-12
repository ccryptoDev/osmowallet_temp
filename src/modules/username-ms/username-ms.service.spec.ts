import { Test, TestingModule } from '@nestjs/testing';
import { UsernameMsService } from './username-ms.service';

describe('UsernameMsService', () => {
  let service: UsernameMsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsernameMsService],
    }).compile();

    service = module.get<UsernameMsService>(UsernameMsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
