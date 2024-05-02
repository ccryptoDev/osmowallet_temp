import { BadRequestException } from '@nestjs/common';
import Decimal from 'decimal.js';
import { Status } from 'src/common/enums/status.enum';
import { TransactionType } from 'src/common/enums/transactionsType.enum';
import { TransactionSubtype } from 'src/common/enums/transactionSubtype.enum';
import { findAndLockWallet } from 'src/common/utils/find-and-lock-wallet';
import { Coin } from 'src/entities/coin.entity';
import { Referral } from 'src/entities/referral.entity';
import { Transaction } from 'src/entities/transaction.entity';
import { TransactionGroup } from 'src/entities/transactionGroup.entity';
import { User } from 'src/entities/user.entity';
import { Wallet } from 'src/entities/wallet.entity';
import { SmsService } from 'src/services/sms/sms.service';
import { EntityManager } from 'typeorm';
import { SendFiatDto } from '../../dtos/sendFiat.dto';
import { SendFiat } from './interfaceSendFiat';

export class SmsSendFiat implements SendFiat {
    constructor(
        private manager: EntityManager,
        private userId: string,
        private data: SendFiatDto,
        private smsService: SmsService,
    ) {}

    async sendFiat(): Promise<boolean> {
        const coin = await this.manager.findOneBy(Coin, { id: this.data.coinId });
        if (!coin) throw new BadRequestException('Moneda a inválida');

        const user = await this.manager.findOneBy(User, { id: this.userId });
        if (!user) throw new BadRequestException('Usuario inválido');
        const mobile = this.data.mobile;
        await this.manager.transaction('SERIALIZABLE', async (entityManager) => {
            const userWallet = await findAndLockWallet({ entityManager: entityManager, coinId: this.data.coinId, userId: this.userId });

            if (!userWallet) throw new BadRequestException('No existe este usuario o moneda');
            if (userWallet.availableBalance < this.data.amount)
                throw new BadRequestException('Balance insuficiente para realizar esta transacción');

            //Debit to current user
            await entityManager.update(Wallet, userWallet.id, {
                availableBalance: new Decimal(userWallet.availableBalance).minus(this.data.amount).toNumber(),
            });

            const transactionGroup = entityManager.create(TransactionGroup, {
                fromUser: user,
                type: TransactionType.TRANSACTION,
                status: Status.PENDING,
                transactionCoin: coin,
                note: this.data.note,
            });
            await entityManager.insert(TransactionGroup, transactionGroup);
            //Record Transactions
            const userTransaction = entityManager.create(Transaction, {
                amount: this.data.amount,
                wallet: userWallet,
                subtype: TransactionSubtype.DEBIT_FIAT_TRANSFER,
                balance: userWallet.availableBalance,
                transactionGroup: transactionGroup,
            });
            const referral = entityManager.create(Referral, {
                inviter: user,
                phoneNumber: mobile,
                transactionGroup: transactionGroup,
            });
            await entityManager.insert(Referral, referral);
            await entityManager.save(userTransaction);

            //SEND SMS TO USER
            const message = `Acabas de recibir ${this.data.amount} ${coin.acronym} de ${user.firstName}. Descarga OsmoWallet desde https://rebrand.ly/osmowallet y crea tu cuenta para obtenerlos.`;
            this.smsService.sendSMS({ message: message, phoneNumber: mobile });
        });
        return true;
    }
}
