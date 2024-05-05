import { CsvWithdrawTemplate } from "src/modules/send-grid/templates/withdrawal/csvWithdraw.template";
import { SendgridTemplate } from "src/modules/send-grid/templates/sendgridBase.template";
import { Transaction } from "src/entities/transaction.entity";
import { OsmoBankAccount } from "src/entities/osmoBank.entity";
import { BankAccount } from "src/entities/bank.account.entity";
import { BankAccountType } from "src/common/enums/bankAccountType.enum";
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const os = require('os')

export class CsvWithdrawHelper{
    private achHeaders = [
        { id: 'osmoAccountNumber'},
        { id: 'osmoAccountType'},
        { id: 'amount'},
        { id: 'accountNumber'},
        { id: 'accountType' },
        { id: 'referenceNumber'},
        { id: 'accountName'},
        { id: 'bankCode'},
    ];

    private bankAccountHeaders = [
        { id: 'bankCode'},
        { id: 'accountNumber'},
        { id: 'accountType' },
        { id: 'accountName'},
    ]
    private csv = createCsvWriter({ path: os.tmpdir()+'/withdraw-requests.csv', header: this.achHeaders });
    private bankAccountCsv = createCsvWriter({ path: os.tmpdir()+'/bank-accounts.csv', header: this.bankAccountHeaders });

    private achElement(transaction: Transaction, osmoBankAccounts: Array<OsmoBankAccount>, index: number){
        const osmoBankAccount = osmoBankAccounts.find(account => account.coin.acronym == transaction.transactionGroup.metadata['bankAddress']['currency'])
        const bankType = transaction.transactionGroup.metadata['bankAddress']['type']
        return {
            osmoAccountNumber: osmoBankAccount.accountNumber.toString().replace(/-/g,''),
            osmoAccountType: 3,
            amount: transaction.amount,
            accountNumber: transaction.transactionGroup.metadata['bankAddress']['accountNumber'],
            accountType: (bankType == BankAccountType.AHORROS || bankType == 'SAVINGS') ? 4 : 3,
            referenceNumber: index,
            accountName: transaction.transactionGroup.metadata['bankAddress']['accountHolder'],
            bankCode: transaction.transactionGroup.metadata['bankAddress']['bankCode'],            
        }
    }

    async createCsv(withdraws : Array<Transaction>, osmoBanksAccounts: Array<OsmoBankAccount>, bankAccounts: Array<BankAccount>) : Promise<SendgridTemplate>{        
        const gtqACHElements = []
        withdraws = withdraws.filter(withdraw => withdraw.transactionGroup.metadata['bankAddress']['bankCode'] != 0)
        for(let i=0; i<withdraws.length; i++){
            gtqACHElements.push(this.achElement(withdraws[i],osmoBanksAccounts,i+1)) 
        }
        await this.csv.writeRecords(gtqACHElements);
        const achRequests = fs.readFileSync(os.tmpdir()+'/withdraw-requests.csv', { encoding: 'base64' });
        const bankAccountsCsv = await this.createBankAccountCsv(bankAccounts)
        const email = process.env.ENV == 'PROD' ? 'victor@osmowallet.com' : 'as@singularagency.co'
        const template = new CsvWithdrawTemplate([{email: email, name:'mika'}],[
            {
                content: achRequests,
                filename: 'ach-requests.csv',
            },
            {
                content: bankAccountsCsv,
                filename: 'bank-accounts.csv',
            }
        ])
        return template
    }

    async createBankAccountCsv(bankAccounts: Array<BankAccount>) {
        const bankAccountElements = [];
        for (let i = 0; i < bankAccounts.length; i++) {
            bankAccountElements.push({
                bankCode: bankAccounts[i].bank.code,
                accountNumber: bankAccounts[i].accountNumber,
                accountType: bankAccounts[i].bankAccountType == BankAccountType.AHORROS ? 4 : 3,
                accountName: bankAccounts[i].accountHolder,
            });
        }
        await this.bankAccountCsv.writeRecords(bankAccountElements);
        const bankAccountsCsv = fs.readFileSync(os.tmpdir()+'/bank-accounts.csv', { encoding: 'base64' });
        return bankAccountsCsv;
    }

}