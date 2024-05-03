import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GlobalPayment } from 'src/entities/globalPayment.entity';
import { RelampagoController } from './relampago.controller';
import { RelampagoService } from './relampago.service';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [ConfigModule, TypeOrmModule.forFeature([GlobalPayment])],
    providers: [RelampagoService],
    controllers: [RelampagoController],
})
export class RelampagoModule {}
