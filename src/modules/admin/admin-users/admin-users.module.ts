import { Module } from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { AdminUsersController } from './admin-users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Verification } from 'src/entities/verification.entity';
import { KycVerification } from 'src/entities/kycVerification.entity';
import { KycModule } from 'src/modules/kyc/kyc.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { TransactionDetail } from 'src/entities/transaction.detail.entity';
import { TransactionGroup } from 'src/entities/transactionGroup.entity';
import { Wallet } from 'src/entities/wallet.entity';
import { FeaturesModule } from 'src/modules/features/features.module';
import { UserTransactionLimit } from 'src/entities/userTransactionLimit.entity';
import { BankAccount } from 'src/entities/bank.account.entity';
import { AlgoliaService } from 'src/services/algolia/algolia.service';
import { TiersModule } from 'src/modules/tiers/tiers.module';
import { WalletsModule } from 'src/modules/wallets/wallets.module';
import { OnvoService } from 'src/services/onvo/onvo.service';
import { MongooseModule } from '@nestjs/mongoose';
import { OnvoPaymentMethod, OnvoPaymentMethodSchema } from 'src/schemas/card.schema';
import { UserCard, UserCardSchema } from 'src/schemas/userCard.schema';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            User,
            Verification,
            KycVerification,
            TransactionDetail,
            TransactionGroup,
            Wallet,
            UserTransactionLimit,
            BankAccount,
        ]),
        MongooseModule.forFeature([
          {name: OnvoPaymentMethod.name, schema: OnvoPaymentMethodSchema},
          {name: UserCard.name, schema: UserCardSchema},
        ]),
        FeaturesModule,
        KycModule,
        AuthModule,
        TiersModule,
        WalletsModule,
    ],
    providers: [AdminUsersService, AlgoliaService, OnvoService],
    controllers: [AdminUsersController],
})
export class AdminUsersModule {}
