import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Coin } from 'src/entities/coin.entity';
import { IbexService } from 'src/modules/ibex/ibex.service';
import { Repository } from 'typeorm';

@Injectable()
export class AdminCoinsService {
    constructor(
        @InjectRepository(Coin) private coinRepository: Repository<Coin>,
        private ibexService: IbexService,
    ){}

    async getBtcPrice(){
        return await this.ibexService.getBtcExchangeRate()
    }

    async getCoins() {
        return await this.coinRepository.find()
    }
}
