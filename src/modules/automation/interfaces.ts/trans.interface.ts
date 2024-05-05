
export interface TransactionMigration {
  btcPrice: number;
  createdAt: string;
  updatedAt: string;
  fromUser: string;
  toUser: string;
  type: string;
  status: string;
  transactionCoin: string;
  transactions: TransactionChild[];
  fees: Fee[];
  note: string;
  metadata: Record<string, unknown>;
}

export interface TransactionChild {
  amount: number;
  balance: number;
  coin: string;
  createdAt: string;
  updatedAt: string;
  subtype: string;
}

export interface Fee {
  amount: number;
  coin: string;
}
