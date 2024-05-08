import { Coin } from 'src/entities/coin.entity';

export function exchangeCoinToUSD(amount: number, coin: Coin) {
    return amount / coin.exchangeRate;
}
