import { IbexService } from 'src/modules/ibex/ibex.service';
import { EntityManager } from 'typeorm';
import { PartnerFlowStrategy } from './partner.flow';
import { LightningInvoiceDto } from 'src/modules/webhooks/dtos/receiveInvoice.dto';
import { Coin } from 'src/entities/coin.entity';
import { CoinEnum } from 'src/modules/me/enums/coin.enum';
import { Wallet } from 'src/entities/wallet.entity';
import { User } from 'src/entities/user.entity';
import { IbexAccount } from 'src/entities/ibex.account.entity';
import { TransactionGroup } from 'src/entities/transactionGroup.entity';
import { Transaction } from 'src/entities/transaction.entity';
import { PartnerStatus } from '../enums/partnerEvent.enum';
import { TransactionFee } from 'src/entities/transactionFee.entity';
import { TransactionType } from 'src/common/enums/transactionsType.enum';
import { PartnerInvoice } from 'src/schemas/partnerInvoice.schema';
import Decimal from 'decimal.js';
import { Partner } from 'src/common/enums/partner.enum';
import { Status } from 'src/common/enums/status.enum';
import { TransactionSubtype } from 'src/common/enums/transactionSubtype.enum';
import { findAndLockWallet } from 'src/common/utils/find-and-lock-wallet';
import { MainWalletsAccount } from 'src/common/enums/main-wallets.enum';
import * as ln from 'lnurl';

export class OsmoWalletUserFlow implements PartnerFlowStrategy {
    constructor(
        private manager: EntityManager,
        private partnerInvoice: PartnerInvoice,
        private ibexService: IbexService,
        private user: User,
        private invoice?: LightningInvoiceDto,
    ) {}

    async deposit(justRecords: boolean = false): Promise<PartnerStatus> {
        let status: PartnerStatus = PartnerStatus.FAILED;
        const userFiatAmountToDeposit = this.partnerInvoice.targetAmount.amount;
        const toCoin = await this.manager.findOne(Coin, {
            where: {
                acronym: CoinEnum.GTQ,
            },
        });
        if (!toCoin) {
            throw new Error('Coin not found');
        }
        if (justRecords == false) {
            await this.depositToMainAccount();
        }
        await this.manager.transaction('SERIALIZABLE', async (transactionalEntityManager) => {
            const [userFiatWallet, osmoFeeWallet] = await Promise.all([
                findAndLockWallet({ entityManager: transactionalEntityManager, coinId: toCoin.id, userId: this.user.id }),
                findAndLockWallet({ entityManager: transactionalEntityManager, coinId: toCoin.id, alias: MainWalletsAccount.FEES }),
            ]);
            if (!userFiatWallet || !osmoFeeWallet) {
                throw new Error('Wallet not found');
            }

            const btcPriceAtMoment = this.partnerInvoice.btcPrice;

            const osmoFiatFeeAmountToDeposit = new Decimal(this.partnerInvoice.originalAmount.amount)
                .minus(this.partnerInvoice.targetAmount.amount)
                .toNumber();
            await Promise.all([
                transactionalEntityManager.update(Wallet, userFiatWallet.id, {
                    availableBalance: new Decimal(userFiatWallet.availableBalance).plus(this.partnerInvoice.targetAmount.amount).toNumber(),
                    balance: new Decimal(userFiatWallet.balance).plus(this.partnerInvoice.targetAmount.amount).toNumber(),
                }),
                transactionalEntityManager.update(Wallet, osmoFeeWallet.id, {
                    availableBalance: new Decimal(osmoFeeWallet.availableBalance).plus(osmoFiatFeeAmountToDeposit).toNumber(),
                    balance: new Decimal(osmoFeeWallet.balance).plus(osmoFiatFeeAmountToDeposit).toNumber(),
                }),
            ]);
            const transactionGroup = transactionalEntityManager.create(TransactionGroup, {
                toUser: this.user,
                type: TransactionType.RECEPTION,
                transactionCoin: toCoin,
                btcPrice: btcPriceAtMoment,
                status: Status.COMPLETED,
                partner: Partner.STRIKE,
            });
            await transactionalEntityManager.insert(TransactionGroup, transactionGroup);
            const userTransaction = transactionalEntityManager.create(Transaction, {
                balance: userFiatWallet.availableBalance,
                amount: userFiatAmountToDeposit,
                transactionGroup: transactionGroup,
                subtype: TransactionSubtype.CREDIT_FIAT_PARTNER,
                wallet: userFiatWallet,
            });

            const osmoFeeTransaction = transactionalEntityManager.create(Transaction, {
                balance: osmoFeeWallet.availableBalance,
                amount: osmoFiatFeeAmountToDeposit,
                transactionGroup: transactionGroup,
                wallet: osmoFeeWallet,
                subtype: TransactionSubtype.FEE_PARTNER,
            });
            const fee = transactionalEntityManager.create(TransactionFee, {
                coin: toCoin,
                transactionGroup: transactionGroup,
                amount: osmoFiatFeeAmountToDeposit,
            });
            await transactionalEntityManager.insert(TransactionFee, fee);
            await transactionalEntityManager.insert(Transaction, [userTransaction, osmoFeeTransaction]);
            status = PartnerStatus.SUCCESS;
        });
        return status;
    }

    private async depositToMainAccount() {
        const ibexAccount = await this.manager.findOneBy(IbexAccount, { user: { id: this.user.id } });
        if (!ibexAccount) {
            throw new Error('Ibex account not found');
        }

        if (!this.invoice) {
            throw new Error('Invoice not found');
        }

        const lnURLDecode = ln.decode(process.env.IBEX_OSMO_LNURL_ADDRESS_PAYER ?? '');
        const params = await this.ibexService.getParams(lnURLDecode);
        await this.ibexService.payLnURL(params, this.invoice.transaction.invoice.amountMsat, ibexAccount.account);
    }
}
