

import { Workbook } from 'exceljs';
import { MonthlyReportTemplate } from 'src/modules/send-grid/templates/automations/montlyReport.template';
import { SendgridTemplate } from 'src/modules/send-grid/templates/sendgridBase.template';
const fs = require('fs');

export interface WalletBalance {
    wallet_id: string;
    wallet_balance: string;
    wallet_available_balance: string;
    wallet_created_at: string;
    reportMonth: string;
    coin_acronym: string;
    account_alias: string;
    user_id: string;
    user_first_name: string;
    user_last_name: string
    nit_nit: string
}

export class AccountingReportHelper {
    static async writeWalletsToExcel(wallets: WalletBalance[]) {
        const workbook = new Workbook();
        const userWallets = wallets.filter(wallet => wallet.account_alias == null)
        const osmoWallets = wallets.filter(wallet => wallet.account_alias != null)
        const currencies = [...new Set(userWallets.map(wallet => wallet.coin_acronym))];
        const groupedWallets = currencies.map(currency => {
            return {
                currency: currency,
                wallets: userWallets.filter(wallet => wallet.coin_acronym == currency)
            };
        });
        groupedWallets.map((walletGroup) => AccountingReportHelper.writeWorksheet(walletGroup.wallets, workbook,`UserWallets (${walletGroup.currency})`))

        AccountingReportHelper.writeWorksheet(osmoWallets, workbook,'OsmoWallets')

        await workbook.xlsx.writeFile('MonthlyReport.xlsx');
    }

    private static async writeWorksheet(wallets: WalletBalance[], workbook: Workbook, worksheetName: string) {
        const worksheet = workbook.addWorksheet(worksheetName);
        
        worksheet.columns = [
          { header: 'Available Balance', key: 'availableBalance', width: 15 },
          { header: 'Balance', key: 'balance', width: 10 },
          { header: 'Date', key: 'date', width: 15 },
          { header: 'Currency', key: 'currency', width: 10 },
          { header: 'Wallet ID', key: 'walletId', width: 50 },
          { header: 'User', key: 'user', width: 30 },
          { header: 'Nit', key: 'nit', width: 30 },
          { header: 'Alias', key: 'alias', width: 20}
        ];
        wallets.forEach(wallet => {
          worksheet.addRow({
            availableBalance: wallet.wallet_available_balance,
            balance: wallet.wallet_balance,
            date: wallet.reportMonth,
            currency: wallet.coin_acronym,
            walletId: wallet.wallet_id,
            user: `${wallet.user_first_name} ${wallet.user_last_name}`,
            alias: wallet.account_alias,
            nit: wallet.nit_nit
          });
        });
      
    }

    static async generateReportTemplate(wallets: WalletBalance[]): Promise<SendgridTemplate> {
        await AccountingReportHelper.writeWalletsToExcel(wallets)
        const reportContent = fs.readFileSync('MonthlyReport.xlsx', { encoding: 'base64' });

        var template = new MonthlyReportTemplate([{email:'as@singularagency.co',name:'mika'}],[
            {
                content: reportContent,
                filename: 'MonthlyReport.xlsx',
            }
        ])
        return template;
    }
}
