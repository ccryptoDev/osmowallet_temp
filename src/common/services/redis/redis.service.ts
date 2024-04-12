import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
    private readonly client: Redis;

    constructor() {
        this.client = new Redis({
            host: process.env.REDIS_HOST,
            port: Number(process.env.REDIS_PORT), 
        });
    }

    async getKeyValue(key: string): Promise<string> {
        return  await  this.client.get(key);
    }

    async setKeyValue(key: string, value: string): Promise<void> {    
        await this.client.set(key, value);
    }

    async deleteKey(key: string): Promise<void> {
        await this.client.del(key);
    }
}