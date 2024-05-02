import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FundingMethod } from 'src/entities/fundingMethod.entity';
import { Otp } from 'src/entities/otp.entity';
import { User } from 'src/entities/user.entity';
import { WithdrawalMethod } from 'src/entities/withdrawalMethod.entity';
import { FundingModule } from 'src/modules/funding/funding.module';
import { UsersModule } from 'src/modules/users/users.module';
import { WithdrawModule } from 'src/modules/withdraw/withdraw.module';
import { CashInOutController } from './cash-in-out.controller';
import { CashInOutService } from './cash-in-out.service';

@Module({
    imports: [TypeOrmModule.forFeature([User, FundingMethod, WithdrawalMethod, Otp]), FundingModule, WithdrawModule, UsersModule],
    controllers: [CashInOutController],
    providers: [CashInOutService],
    exports: [CashInOutService],
})
export class CashInOutModule {}
