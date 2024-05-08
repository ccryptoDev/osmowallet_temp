import { Withdraw } from './withdraw';

export class WithdrawContext {
    private strategy: Withdraw;

    constructor(strategy: Withdraw) {
        this.strategy = strategy;
    }

    async withdraw() {
        return await this.strategy.withdraw();
    }
}
