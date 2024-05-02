import { Status } from 'src/common/enums/status.enum';

export interface RidiviStatusTransaction {
    status: Status;
    transactionGroupId: string;
    error?: string | null;
}
