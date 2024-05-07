import { createObjectCsvWriter } from 'csv-writer';

export class CsvHelper {
    static USER_FILENAME = 'users.csv';
    static TRANSACTIONS_FILENAME = 'transactions.csv';

    static async createCsv(data: Array<any>, fileName: string) {
        const csvWriter = createObjectCsvWriter({
            path: fileName,
            header: Object.keys(data[0]).map((key) => ({ id: key, title: key.toUpperCase().replace('_', ' ') })),
        });
        await csvWriter.writeRecords(data);
    }
}
