export interface OnvoPaymentMethodCard {
    id: string;
    accountId: string;
    mode: string;
    source: string;
    holderName: string;
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
    updatedAt: string;
    createdAt: string;
    customerId: string;
    consumerId: string | null;
    tokenId: string | null;
}

export interface OnvoPaymentMethodBankAccount {
    currency: string;
    entity: string;
    maskedIban: string;
}

export interface PaymentMethodBillingAddress {
    city: string | null;
    country: string;
    line1: string | null;
    line2: string | null;
    postalCode: string | null;
    state: string | null;
}

export interface PaymentMethodBilling {
    address: PaymentMethodBillingAddress;
    name: string;
    phone: string | null;
}

export interface OnvoPaymentMethodResponse {
    id: string;
    bankAccount: OnvoPaymentMethodBankAccount | null;
    card: OnvoPaymentMethodCard | null;
    billing: PaymentMethodBilling;
    createdAt: string;
    customerId: string;
    mode: string;
    status: string;
    type: string;
    updatedAt: string;
}
