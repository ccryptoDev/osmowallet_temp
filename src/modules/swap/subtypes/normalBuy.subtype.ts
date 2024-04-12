import { BaseBuySubtype } from "./buy.subtype";

export class NormalBuySubtype extends BaseBuySubtype{
    fee: string = 'fee-buy'
    debitBtcOsmo: string = 'debit-btc-buy-osmo'
    creditBtcBuy: string = 'credit-btc-buy'
    debitFiatBuy: string = 'debit-fiat-buy'

    private static instance: NormalBuySubtype;

    public static getInstance(): NormalBuySubtype {
        if (!NormalBuySubtype.instance) {
            NormalBuySubtype.instance = new NormalBuySubtype();
        }

        return NormalBuySubtype.instance;
    }
}
