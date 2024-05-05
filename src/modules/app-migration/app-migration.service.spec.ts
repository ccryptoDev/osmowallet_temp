import { Test, TestingModule } from '@nestjs/testing';
import { AppMigrationService } from './app-migration.service';

describe('AppMigrationService', () => {
  let service: AppMigrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppMigrationService],
    }).compile();

    service = module.get<AppMigrationService>(AppMigrationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
