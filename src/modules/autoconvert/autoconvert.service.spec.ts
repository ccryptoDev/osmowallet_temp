import { Test, TestingModule } from '@nestjs/testing';
import { AutoconvertService } from './autoconvert.service';

describe('AutoconvertService', () => {
  let service: AutoconvertService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AutoconvertService],
    }).compile();

    service = module.get<AutoconvertService>(AutoconvertService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
