import { RidiviStatusTransaction } from './ridivi-status-transaction';

export interface RidiviStrategy {
    updateTransaction(data: RidiviStatusTransaction): Promise<any>;
}
