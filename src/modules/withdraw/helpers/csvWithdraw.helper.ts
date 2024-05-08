import { BankAccountType } from 'src/common/enums/bankAccountType.enum';
import { BankAccount } from 'src/entities/bank.account.entity';
import { OsmoBankAccount } from 'src/entities/osmoBank.entity';
import { Transaction } from 'src/entities/transaction.entity';
import { SendgridTemplate } from 'src/modules/send-grid/templates/sendgridBase.template';
import { CsvWithdrawTemplate } from 'src/modules/send-grid/templates/withdrawal/csvWithdraw.template';
import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';
import * as fs from 'fs';
import * as os from 'os';

export class CsvWithdrawHelper {
    private achHeaders = [
        { id: 'osmoAccountNumber', title: 'Osmo Account Number' },
        { id: 'osmoAccountType', title: 'Osmo Account Type' },
        { id: 'amount', title: 'Amount' },
        { id: 'accountNumber', title: 'Account Number' },
        { id: 'accountType', title: 'Account Type' },
        { id: 'referenceNumber', title: 'Reference Number' },
        { id: 'accountName', title: 'Account Name' },
        { id: 'bankCode', title: 'Bank Code' },
    ];
    private bankAccountHeaders = [
        { id: 'bankCode', title: 'Bank Code' },
        { id: 'accountNumber', title: 'Account Number' },
        { id: 'accountType', title: 'Account Type' },
        { id: 'accountName', title: 'Account Name' },
    ];
    private csv = createCsvWriter({ path: os.tmpdir() + '/withdraw-requests.csv', header: this.achHeaders });
    private bankAccountCsv = createCsvWriter({ path: os.tmpdir() + '/bank-accounts.csv', header: this.bankAccountHeaders });

    private achElement(transaction: Transaction, osmoBankAccounts: Array<OsmoBankAccount>, index: number) {
        const osmoBankAccount = osmoBankAccounts.find(
            (account) =>
                account.coin.acronym ==
                transaction.transactionGroup.metadata['bankAddress' as keyof typeof transaction.transactionGroup.metadata]['currency'],
        );
        const bankType = transaction.transactionGroup.metadata['bankAddress' as keyof typeof transaction.transactionGroup.metadata]['type'];
        return {
            osmoAccountNumber: osmoBankAccount?.accountNumber.toString().replace(/-/g, ''),
            osmoAccountType: 3,
            amount: transaction.amount,
            accountNumber:
                transaction.transactionGroup.metadata['bankAddress' as keyof typeof transaction.transactionGroup.metadata]['accountNumber'],
            accountType: bankType == BankAccountType.AHORROS || bankType == 'SAVINGS' ? 4 : 3,
            referenceNumber: index,
            accountName:
                transaction.transactionGroup.metadata['bankAddress' as keyof typeof transaction.transactionGroup.metadata]['accountHolder'],
            bankCode:
                transaction.transactionGroup.metadata['bankAddress' as keyof typeof transaction.transactionGroup.metadata]['bankCode'],
        };
    }

    async createCsv(
        withdraws: Array<Transaction>,
        osmoBanksAccounts: Array<OsmoBankAccount>,
        bankAccounts: Array<BankAccount>,
    ): Promise<SendgridTemplate> {
        const gtqACHElements = [];
        withdraws = withdraws.filter(
            (withdraw) =>
                withdraw.transactionGroup.metadata['bankAddress' as keyof typeof withdraw.transactionGroup.metadata]['bankCode'] !== 0,
        );
        let i = 0;
        for (const withdraw of withdraws) {
            gtqACHElements.push(this.achElement(withdraw, osmoBanksAccounts, i++));
        }
        await this.csv.writeRecords(gtqACHElements);
        const achRequests = fs.readFileSync(os.tmpdir() + '/withdraw-requests.csv', { encoding: 'base64' });
        const bankAccountsCsv = await this.createBankAccountCsv(bankAccounts);
        const email = process.env.ENV == 'PROD' ? 'victor@osmowallet.com' : 'as@singularagency.co';
        const template = new CsvWithdrawTemplate(
            [{ email: email, name: 'mika' }],
            [
                {
                    content: achRequests,
                    filename: 'ach-requests.csv',
                },
                {
                    content: bankAccountsCsv,
                    filename: 'bank-accounts.csv',
                },
            ],
        );
        return template;
    }

    async createBankAccountCsv(bankAccounts: Array<BankAccount>) {
        const bankAccountElements = [];
        for (let i = 0; i < bankAccounts.length; i++) {
            bankAccountElements.push({
                bankCode: bankAccounts[i]?.bank.code,
                accountNumber: bankAccounts[i]?.accountNumber,
                accountType: bankAccounts[i]?.bankAccountType == BankAccountType.AHORROS ? 4 : 3,
                accountName: bankAccounts[i]?.accountHolder,
            });
        }
        await this.bankAccountCsv.writeRecords(bankAccountElements);
        const bankAccountsCsv = fs.readFileSync(os.tmpdir() + '/bank-accounts.csv', { encoding: 'base64' });
        return bankAccountsCsv;
    }
}
