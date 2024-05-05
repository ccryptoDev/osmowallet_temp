import { Module } from '@nestjs/common';
import { PeriodsService } from './periods.service';
import { PeriodsController } from './periods.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Period } from 'src/entities/period.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Period
    ])
  ],
  providers: [PeriodsService],
  controllers: [PeriodsController]
})
export class PeriodsModule {}
