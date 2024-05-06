export interface BanxaOrder {
    id:                  string;
    account_id:          string;
    account_reference:   string;
    order_type:          string;
    payment_type:        number;
    ref:                 number;
    fiat_code:           string;
    fiat_amount:         number;
    coin_code:           string;
    coin_amount:         number;
    wallet_address:      string;
    wallet_address_tag:  null;
    fee:                 number;
    fee_tax:             number;
    payment_fee:         number;
    payment_fee_tax:     number;
    commission:          number;
    tx_hash:             null;
    tx_confirms:         number;
    created_date:        string;
    created_at:          string;
    status:              string;
    completed_at:        null;
    merchant_fee:        number;
    merchant_commission: null;
    meta_data:           string;
    blockchain:          Blockchain;
}

export interface Blockchain {
    id:          number;
    code:        string;
    description: string;
}
