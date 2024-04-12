

export interface OnvoCustomerAddress {
  city: string | null;
  country: string;
  line1: string | null;
  line2: string | null;
  postalCode: string | null;
  state: string | null;
}

export interface OnvoCustomerShipping {
  address: OnvoCustomerAddress;
  name: string;
  phone: string | null;
}

export interface OnvoCustomer {
  id: string;
  address: OnvoCustomerAddress;
  amountSpent: number;
  description: string;
  createdAt: string;
  email: string;
  lastTransactionAt: string | null;
  mode: string;
  name: string;
  phone: string;
  shipping: OnvoCustomerShipping;
  transactionsCount: number;
  updatedAt: string;
}
