import { Funding } from './funding';

export class FundingContext {
    private strategy: Funding;
    constructor(strategy: Funding) {
        this.strategy = strategy;
    }

    async fund() {
        return await this.strategy.fund();
    }
}
