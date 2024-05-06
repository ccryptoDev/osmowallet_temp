import { Test, TestingModule } from '@nestjs/testing';
import { GoogleCloudTasksService } from './google-cloud-tasks.service';

describe('GoogleCloudTasksService', () => {
  let service: GoogleCloudTasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GoogleCloudTasksService],
    }).compile();

    service = module.get<GoogleCloudTasksService>(GoogleCloudTasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
