import { SendFiat } from './strategies/interfaceSendFiat';

export class SendFiatContext {
    private strategy: SendFiat;

    constructor(strategy: SendFiat) {
        this.strategy = strategy;
    }

    async executeSend() {
        return await this.strategy.sendFiat();
    }
}
