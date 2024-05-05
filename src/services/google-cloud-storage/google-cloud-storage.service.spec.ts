import { Test, TestingModule } from '@nestjs/testing';
import { GoogleCloudStorageService } from './google-cloud-storage.service';

describe('GoogleCloudStorageService', () => {
  let service: GoogleCloudStorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GoogleCloudStorageService],
    }).compile();

    service = module.get<GoogleCloudStorageService>(GoogleCloudStorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
