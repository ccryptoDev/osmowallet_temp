

export interface PaymentIntentCharge {
  id: string;
  amount: number;
  baseAmount: number;
  exchangeRate: number;
  currency: string;
  createdAt: string;
  failureCode: string;
  failureMessage: string;
  isApproved: boolean;
  isCaptured: boolean;
  status: string;
}

export interface PaymentIntentError {
  code: string;
  message: string;
  type: string;
}

export interface PaymentIntentMetadata {
  orderId: string;
  cartId: string;
}

export interface OnvoPaymentIntent {
  id: string;
  amount: number;
  baseAmount: number;
  exchangeRate: number;
  currency: string;
  createdAt: string;
  customerId: string;
  description: string;
  charges: PaymentIntentCharge[];
  lastPaymentError: PaymentIntentError;
  mode: string;
  status: string;
  updatedAt: string;
  metadata: PaymentIntentMetadata;
}
