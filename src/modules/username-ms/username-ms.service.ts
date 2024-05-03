import { Injectable, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { LNMSResponse } from './models/accountResponse';
import { IbexAccount } from 'src/entities/ibex.account.entity';

@Injectable()
export class UsernameMsService {
    private baseURL = process.env.OSMO_MONEY_URL;
    private apikey = process.env.OSMO_MONEY_API_KEY;

    async getAllUsernames(): Promise<LNMSResponse[]> {
        try {
            const config = {
                method: 'GET',
                url: `/ln-addresses`,
                baseURL: this.baseURL,
                headers: {
                    Authorization: this.apikey,
                },
            };
            const response = await axios(config);
            return response.data;
        } catch (error) {
            throw new BadRequestException('Error getting all usernames');
        }
    }

    async getByUsername(username: string): Promise<LNMSResponse | null> {
        try {
            const config = {
                method: 'GET',
                url: `/.well-known/lnurlp/${username}`,
                baseURL: this.baseURL,
                headers: {
                    Authorization: this.apikey,
                },
            };
            const response = await axios(config);
            return response.data;
        } catch (error) {
            console.log(error);
            return null;
            throw new BadRequestException('Error getting username');
        }
    }

    async createUsername(accountId: string, username: string): Promise<LNMSResponse> {
        try {
            const config = {
                method: 'POST',
                url: `/ln-addresses`,
                baseURL: this.baseURL,
                headers: {
                    Authorization: this.apikey,
                },
                data: {
                    AccountId: accountId,
                    Username: username,
                },
            };
            const response = await axios(config);
            return response.data;
        } catch (error) {
            throw new BadRequestException('Error creating username');
        }
    }

    async updateUsername(ibexAccount: IbexAccount, username: string) {
        try {
            const config = {
                method: 'PUT',
                url: `/ln-addresses/${ibexAccount.usernameId}`,
                baseURL: this.baseURL,
                headers: {
                    Authorization: this.apikey,
                },
                data: {
                    AccountId: ibexAccount.account,
                    Username: username,
                },
            };
            const response = await axios(config);
            return response.data;
        } catch (error) {
            throw new BadRequestException('Error deleting username');
        }
    }

    async deleteUsername(lnId: string) {
        try {
            const config = {
                method: 'DELETE',
                url: `/ln-addresses/${lnId}`,
                baseURL: this.baseURL,
                headers: {
                    Authorization: this.apikey,
                },
            };
            const response = await axios(config);
            return response.data;
        } catch (error) {
            throw new BadRequestException('Error deleting username');
        }
    }
}
