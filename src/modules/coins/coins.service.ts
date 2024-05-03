import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as Sentry from '@sentry/node';
import { DOMParser } from '@xmldom/xmldom';
import axios from 'axios';
import Decimal from 'decimal.js';
import { RedisService } from 'src/common/services/redis/redis.service';
import { Coin } from 'src/entities/coin.entity';
import { CountryCoin } from 'src/entities/countryCoin.entity';
import { HistoricCoinRate } from 'src/entities/historicCoinRate.entity';
import { HistoricRate } from 'src/entities/historicRates.entity';
import { Not, Repository } from 'typeorm';
import { IbexService } from '../ibex/ibex.service';
import { CoinEnum } from '../me/enums/coin.enum';
import { BccrRate } from './interfaces/bccr-rate';

@Injectable()
export class CoinsService {
    private readonly logger = new Logger(CoinsService.name);
    private historicRateKey = `last-coin-rate-id`;
    constructor(
        @InjectRepository(Coin) private coinRepository: Repository<Coin>,
        @InjectRepository(HistoricCoinRate) private historicCoinRateRepository: Repository<HistoricCoinRate>,
        @InjectRepository(HistoricRate) private historicRateRepository: Repository<HistoricRate>,
        @InjectRepository(CountryCoin) private countryCoinRepository: Repository<CountryCoin>,
        private ibexService: IbexService,
        private redisService: RedisService,
    ) {}

    async getLastHistoricRateId(): Promise<string> {
        const key = this.historicRateKey;
        const lastId = await this.redisService.getKeyValue(key);
        if (key && lastId) return lastId;
        await this.cachLastHistoricRateId();
        return await this.getLastHistoricRateId();
    }

    private async cachLastHistoricRateId() {
        const key = this.historicRateKey;
        const historicRates = await this.historicRateRepository.find({ order: { id: 'DESC' }, take: 1 });
        if (historicRates.length === 0) return;
        const lastHistoricRate = historicRates[0];
        await this.redisService.setKeyValue(key, lastHistoricRate?.id ?? '');
    }

    async getCoinById(id: string) {
        return await this.coinRepository.findOneBy({ id: id });
    }

    //Obtain USD/CRC exchange rate from Banco Central de Costa Rica
    async getCRCExchangeRates(): Promise<BccrRate> {
        const currentDate = new Date();
        const todayDate = currentDate.getDate() + '/' + (currentDate.getMonth() + 1) + '/' + currentDate.getFullYear();
        const BCCRurl = 'https://gee.bccr.fi.cr/Indicadores/Suscripciones/WS/wsindicadoreseconomicos.asmx/ObtenerIndicadoresEconomicos';

        const fullURL = `${BCCRurl}?FechaInicio=${todayDate}&FechaFinal=${todayDate}&Nombre=N&SubNiveles=N&CorreoElectronico=as@singularagency.co&Token=${process.env.BCCR_TOKEN}`;
        const compra = axios({
            url: `${fullURL}&Indicador=317`,
            method: 'GET',
        });
        const venta = axios({
            url: `${fullURL}&Indicador=318`,
            method: 'GET',
        });

        const response = await axios.all([compra, venta]).then(
            axios.spread(function (compra, venta) {
                const compraNode = new DOMParser().parseFromString(compra.data, 'text/xml');
                const ventaNode = new DOMParser().parseFromString(venta.data, 'text/xml');

                return {
                    buy: new Decimal(
                        parseFloat(compraNode.documentElement.getElementsByTagName('NUM_VALOR')[0]?.childNodes[0]?.nodeValue ?? '').toFixed(
                            2,
                        ),
                    ).toNumber(),
                    sell: new Decimal(
                        parseFloat(ventaNode.documentElement.getElementsByTagName('NUM_VALOR')[0]?.childNodes[0]?.nodeValue ?? '').toFixed(
                            2,
                        ),
                    ).toNumber(),
                } as BccrRate;
            }),
        );
        return response;
    }

    async getCoinsByResidence(countryCode: string) {
        const countryCoins = await this.countryCoinRepository.find({
            relations: {
                coin: true,
            },
            where: {
                countryCode: countryCode,
            },
        });
        return countryCoins.map((countryCoin) => countryCoin.coin);
    }

    async updateExchangesRates() {
        try {
            let coinsFixed = await this.coinRepository.find({ where: { acronym: Not(CoinEnum.SATS) } });
            const acronymCoins = coinsFixed.map((coin) => coin.acronym).join(',');
            const crcRate = await this.getCRCExchangeRates();
            const config = {
                method: 'GET',
                url: 'https://currency-converter5.p.rapidapi.com/currency/convert',
                params: { format: 'json', from: 'USD', to: acronymCoins, amount: '1' },
                headers: {
                    'X-RapidAPI-Key': process.env.EXCHANGE_RATE_KEY,
                    'X-RapidAPI-Host': 'currency-converter5.p.rapidapi.com',
                },
            };
            const response = await axios(config)
                .then((re) => re.data.rates)
                .catch((error) => Sentry.captureException(error));
            coinsFixed = coinsFixed.map((coin) => {
                if (coin.acronym in response) {
                    coin.exchangeRate = parseFloat(parseFloat(response[coin.acronym]['rate']).toFixed(2));
                }
                if (coin.acronym === 'CRC') {
                    coin.exchangeRate = crcRate.sell;
                }
                return coin;
            });

            await this.coinRepository.save(coinsFixed);
            const coinRates = [];
            const historicRate = this.historicRateRepository.create({});
            await this.historicRateRepository.insert(historicRate);
            for (let i = 0; i < coinsFixed.length; i++) {
                coinRates.push({
                    coin: coinsFixed[i],
                    historicRate: historicRate,
                    exchangeRate: coinsFixed[i]?.exchangeRate,
                });
            }
            const coinRatesCreated = this.historicCoinRateRepository.create(coinRates);
            await this.historicCoinRateRepository.insert(coinRatesCreated);
            const coins = await this.coinRepository.find({ where: { acronym: Not('USDT') } });
            await this.redisService.setKeyValue('coins', JSON.stringify(coins));
            await this.cachLastHistoricRateId();
        } catch (error) {
            Sentry.captureException(error);
            if (error instanceof Error) this.logger.error(`ACTION: Update Exchanges Rates, STATUS: FAILED, REASON: ${error.toString()}`);
            throw error;
        }
    }

    async getBtcPrice() {
        return await this.ibexService.getBtcExchangeRate();
    }

    async getGTQExchangeRate() {
        try {
            const config = {
                method: 'GET',
                url: 'https://currency-converter5.p.rapidapi.com/currency/convert',
                params: { format: 'json', from: 'USD', to: 'GTQ', amount: '1' },
                headers: {
                    'X-RapidAPI-Key': process.env.EXCHANGE_RATE_KEY,
                    'X-RapidAPI-Host': 'currency-converter5.p.rapidapi.com',
                },
            };
            const response = await axios(config);
            return new Decimal(response.data.rates.GTQ.rate).toNumber().toFixed(2);
        } catch (error) {
            Sentry.captureException(error);
            if (error instanceof Error) this.logger.error(`ACTION: Get GTQ Exchange Rate, STATUS: FAILED, REASON: ${error.toString()}`);
            throw error;
        }
    }

    async getAll() {
        // const coinsCached = await this.redisService.getKeyValue('coins')
        // if(coinsCached){
        //     return JSON.parse(coinsCached)
        // }
        const coins = await this.coinRepository.find({ where: { isActive: true } });
        return coins.filter((coin) => coin.acronym != 'USDT');
    }
}
