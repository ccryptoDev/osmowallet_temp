import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { WithdrawDto } from './dtos/Withdraw.dto';

@Injectable()
export class StillmanService {
    private baseURL: string = process.env.STILLMAN_BASE_URL ?? '';
    private apiKey: string = process.env.STILLMAN_PUBLIC_KEY ?? '';
    private apiSecret: string = process.env.STILLMAN_PRIVATE_KEY ?? '';

    async createWithdraw(withdrawDto: WithdrawDto) {
        const URL = `${this.baseURL}/v1/withdraw/initiate`;
        const config = {
            headers: {
                publickey: this.apiKey,
                privatekey: this.apiSecret,
            },
            body: {
                assetCode: withdrawDto.assetCode,
                addressId: withdrawDto.addressId,
                quantity: withdrawDto.quantity,
            },
        };

        const response = await axios.post(URL, config);
        return response;
    }

    async getWithdraw(assetCode: string) {
        const URL = `${this.baseURL}/v1/withdraw?assetCode=${assetCode}`;
        const config = {
            headers: {
                publickey: this.apiKey,
                privatekey: this.apiSecret,
            },
        };

        const response = await axios.get(URL, config);
        return response;
    }
}
