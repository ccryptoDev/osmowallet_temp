import { Module } from '@nestjs/common';
import { RelampagoService } from './relampago.service';
import { RelampagoController } from './relampago.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GlobalPayment } from 'src/entities/globalPayment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GlobalPayment
    ])
  ],
  providers: [RelampagoService],
  controllers: [RelampagoController]
})
export class RelampagoModule {}
