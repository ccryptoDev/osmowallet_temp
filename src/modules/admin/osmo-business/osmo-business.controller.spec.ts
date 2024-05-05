import { Test, TestingModule } from '@nestjs/testing';
import { OsmoBusinessController } from './osmo-business.controller';

describe('OsmoBusinessController', () => {
  let controller: OsmoBusinessController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OsmoBusinessController],
    }).compile();

    controller = module.get<OsmoBusinessController>(OsmoBusinessController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
