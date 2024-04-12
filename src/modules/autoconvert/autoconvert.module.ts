import { Module } from '@nestjs/common';
import { AutoconvertService } from './autoconvert.service';
import { AutoconvertController } from './autoconvert.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Autoconvert } from 'src/entities/autoconvert.entity';
import { Coin } from 'src/entities/coin.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Autoconvert,
      Coin
    ])
  ],
  providers: [AutoconvertService],
  controllers: [AutoconvertController]
})
export class AutoconvertModule {}
