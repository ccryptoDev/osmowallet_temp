import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BankAccount } from 'src/entities/bank.account.entity';
import { Bank } from 'src/entities/bank.entity';
import { User } from 'src/entities/user.entity';
import { BankController } from './banks.controller';
import { BankService } from './banks.service';
import { AccessTokenGuard } from '../auth/guards/accessToken.guard';
import { PartnerAccessTokenGuard } from '../auth/guards/partnerAccessToken.guard';
import { AccessTokenStrategy } from '../auth/strategies/accessToken.strategy';
import { PartnerAccessTokenStrategy } from '../auth/strategies/partner.strategy';
import { OsmoBankAccount } from 'src/entities/osmoBank.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([User,Bank,BankAccount,OsmoBankAccount]),
    ],
    controllers: [BankController],
    providers: [
        BankService,
        AccessTokenGuard,
        PartnerAccessTokenGuard,
        AccessTokenStrategy,
        PartnerAccessTokenStrategy
    ],
    exports: [TypeOrmModule]
})
export class BankModule {}
