

export interface StrikePayout {
  id: string;
  state: string;
  paymentMethodId: string;
  originatorId: string;
  amount: {
    amount: string;
    currency: string;
  };
}
