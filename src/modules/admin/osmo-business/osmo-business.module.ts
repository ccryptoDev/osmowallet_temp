import { Module } from '@nestjs/common';
import { OsmoBusinessController } from './osmo-business.controller';
import { OsmoBusinessService } from './osmo-business.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OsmoBusinessBpt } from 'src/entities/osmoBusinessBPT.entity';
import { GoogleCloudStorageService } from 'src/services/google-cloud-storage/google-cloud-storage.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OsmoBusinessBpt
    ])
  ],
  controllers: [OsmoBusinessController],
  providers: [OsmoBusinessService,GoogleCloudStorageService]
})
export class OsmoBusinessModule {}
