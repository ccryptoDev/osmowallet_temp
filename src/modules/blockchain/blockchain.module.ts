import { Module } from '@nestjs/common';
import { BlockchainController } from './blockchain.controller';
import { BlockchainService } from './blockchain.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockchainNetwork } from 'src/entities/blockchainNetworks.entity';
import { BlockchainNetworkAddress } from 'src/entities/userBlockchainNetworkAddress.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BlockchainNetwork,
      BlockchainNetworkAddress,
    ])
  ],
  controllers: [BlockchainController],
  providers: [BlockchainService]
})
export class BlockchainModule {}
