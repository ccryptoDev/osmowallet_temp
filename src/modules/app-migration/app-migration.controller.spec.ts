import { Test, TestingModule } from '@nestjs/testing';
import { AppMigrationController } from './app-migration.controller';

describe('AppMigrationController', () => {
  let controller: AppMigrationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppMigrationController],
    }).compile();

    controller = module.get<AppMigrationController>(AppMigrationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
