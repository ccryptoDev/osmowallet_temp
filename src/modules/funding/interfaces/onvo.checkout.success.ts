
export interface OnvoCheckoutSuccess {
  type: string;
  data: {
    mode: string;
    paymentStatus: string;
    currency: string;
    url: string;
    capturableAmount: number;
    baseAmount: number;
    amount: number;
    createdAt: string;
    metadata: object;
    customer: {
      id: string;
      name: string;
      phone: string;
      email: string;
    };
    lineItems: [
      {
        name: string;
        description: string;
        currency: string;
        amount: number;
      }
    ];
  };
}
