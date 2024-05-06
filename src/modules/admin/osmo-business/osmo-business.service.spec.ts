import { Test, TestingModule } from '@nestjs/testing';
import { OsmoBusinessService } from './osmo-business.service';

describe('OsmoBusinessService', () => {
  let service: OsmoBusinessService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OsmoBusinessService],
    }).compile();

    service = module.get<OsmoBusinessService>(OsmoBusinessService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
