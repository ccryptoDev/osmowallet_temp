import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as Sentry from "@sentry/node";
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
    private historicRateKey = `last-coin-rate-id`
    constructor(
        @InjectRepository(Coin) private coinRepository: Repository<Coin>,
        @InjectRepository(HistoricCoinRate) private historicCoinRateRepository: Repository<HistoricCoinRate>,
        @InjectRepository(HistoricRate) private historicRateRepository: Repository<HistoricRate>,
        @InjectRepository(CountryCoin) private countryCoinRepository: Repository<CountryCoin>,
        // @InjectModel(EveryFiveMinutesHistoricBtcPrice.name) private fiveMinutesBtcPriceModel: Model<EveryFiveMinutesHistoricBtcPrice>,
        // @InjectModel(HourlyHistoricBtcPrice.name) private hourlyBtcPriceModel: Model<HourlyHistoricBtcPrice>,
        // @InjectModel(DailyHistoricBtcPrice.name) private dailyBtcPriceModel: Model<DailyHistoricBtcPrice>,
        private ibexService: IbexService,
        private redisService: RedisService,
    ){
        //this.updateExchangesRates()
    }

    async getLastHistoricRateId() : Promise<string>{
        const key = this.historicRateKey
        const lastId = await this.redisService.getKeyValue(key)
        if(key) return lastId
        await this.cachLastHistoricRateId()
        return await this.getLastHistoricRateId()
    }

    private async cachLastHistoricRateId(){
        const key = this.historicRateKey
        const lastHistoricRate = (await this.historicRateRepository.find({order: { id: 'DESC' },take: 1,}))[0];
        await this.redisService.setKeyValue(key,lastHistoricRate.id)
    }

    async getCoinById(id: string){
        return await this.coinRepository.findOneBy({id: id})
    }


    //Obtain USD/CRC exchange rate from Banco Central de Costa Rica
    async getCRCExchangeRates() : Promise<BccrRate>{
        const currentDate = new Date();
        const todayDate = currentDate.getDate() + "/" + (currentDate.getMonth() + 1) + "/" + currentDate.getFullYear()
        const BCCRurl = 'https://gee.bccr.fi.cr/Indicadores/Suscripciones/WS/wsindicadoreseconomicos.asmx/ObtenerIndicadoresEconomicos';

        const fullURL = `${BCCRurl}?FechaInicio=${todayDate}&FechaFinal=${todayDate}&Nombre=N&SubNiveles=N&CorreoElectronico=as@singularagency.co&Token=${process.env.BCCR_TOKEN}`
        const compra = axios({
            url: `${fullURL}&Indicador=317`,
            method: 'GET',
        })
        const venta = axios({
            url: `${fullURL}&Indicador=318`,
            method: 'GET',
        })

        const response = await axios.all([compra, venta]).then(axios.spread(function (compra, venta) {
            const compraNode = new DOMParser().parseFromString(compra.data, 'text/xml');
            const ventaNode = new DOMParser().parseFromString(venta.data, 'text/xml'); 

            return {
                'buy': new Decimal(parseFloat(compraNode.documentElement.getElementsByTagName('NUM_VALOR')[0].childNodes[0].nodeValue).toFixed(2)).toNumber(),
                'sell': new Decimal(parseFloat(ventaNode.documentElement.getElementsByTagName('NUM_VALOR')[0].childNodes[0].nodeValue).toFixed(2)).toNumber()
            } as BccrRate;
        }));
        console.log(response)
        return response
    }

    // async setUpInitHistoricBtcPrice() {
    //     const config = {
    //         method: 'GET',
    //         headers: {
    //             'X-Access-Token': 'coinranking95e9afc3fbbbc477e4d81c47e663052697fe5491fc958738'
    //         },
    //         baseURL: 'https://api.coinranking.com/v2/coin/Qwsogvtv82FCd/history?timePeriod=5y'
    //     }
    //     const response = await axios(config)
    //     const list = response.data.data.history
    //     const data = list.map((ob) => ({price: Number(ob.price), date: new Date(ob.timestamp * 1000)}))
    //     // await this.dailyBtcPriceModel.insertMany(data)
    // }

    // async getYearlyHistoricBtcPrice(){
    //     const oneYearAgo = new Date();
    //     oneYearAgo.setDate(oneYearAgo.getDate() - 366);
    //     const data = await this.dailyBtcPriceModel.find({ date: { $gte: oneYearAgo } }).sort({ date: -1 });
    //     const lastPrice = data[0].price;
    //     const firstPrice = data[data.length - 1].price;
    //     const change = Number(((lastPrice - firstPrice) / firstPrice * 100).toFixed(2))
    //     return {
    //         change: change,
    //         data: data
    //     };
    // }

    // async getMonthlyHistoricBtcPrice(){
    //     const thirtyDaysAgo = new Date();
    //     thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    //     const data = await this.hourlyBtcPriceModel.find({ date: { $gte: thirtyDaysAgo } }).sort({ date: -1 });
    //     const lastPrice = data[0].price;
    //     const firstPrice = data[data.length - 1].price;
    //     const change = Number(((lastPrice - firstPrice) / firstPrice * 100).toFixed(2))
    //     return {
    //         change: change,
    //         data: data
    //     };
    //  }

    // async getWeeklyHistoricBtcPrice(){
    //    const sevenDaysAgo = new Date();
    //    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    //    const data = await this.hourlyBtcPriceModel.find({ date: { $gte: sevenDaysAgo } }).sort({ date: -1 });
    //    const lastPrice = data[0].price;
    //    const firstPrice = data[data.length - 1].price;
    //    const change = Number(((lastPrice - firstPrice) / firstPrice * 100).toFixed(2))
    //    return {
    //        change: change,
    //        data: data
    //    };
    // }

    // async getDailyHistoricBtcPrice(){
    //    const oneDayAgo = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
    //    const data = await this.hourlyBtcPriceModel.find({ date: { $gte: oneDayAgo } }).sort({ date: -1 });
    //    const lastPrice = data[0].price;
    //    const firstPrice = data[data.length - 1].price;
    //    const change = Number(((lastPrice - firstPrice) / firstPrice * 100).toFixed(2))
    //    return {
    //        change: change,
    //        data: data
    //    };
    // }

    // async updateFiveMinutesHistoricBtcPrice() {
    //     const btcPrice = await this.ibexService.getBtcExchangeRate()
    //     const date = new Date();
    //     date.setSeconds(0, 0);
    //     const datetime = date.toISOString();
    //     await this.fiveMinutesBtcPriceModel.create({
    //         price: btcPrice.rate,
    //         date: date
    //     })
    // }

    // async updateHourlyHistoricBtcPrice(){
    //     const btcPrice = await this.ibexService.getBtcExchangeRate()
    //     const date = new Date();
    //     date.setSeconds(0, 0);
    //     await this.hourlyBtcPriceModel.create({
    //         price: btcPrice.rate,
    //         date: date
    //     })
    // }

    // async updateDailyHistoricBtcPrice() {
    //     const btcPrice = await this.ibexService.getBtcExchangeRate()
    //     const date = new Date();
    //     date.setSeconds(0, 0);
    //     await this.dailyBtcPriceModel.create({
    //         price: btcPrice.rate,
    //         date: date
    //     })
    // }

    async getCoinsByResidence(countryCode: string) {
        const countryCoins = await this.countryCoinRepository.find({
            relations: {
                coin: true
            },
            where: {
                countryCode: countryCode
            }
        })
        return countryCoins.map((countryCoin) => countryCoin.coin)
    }

    async updateExchangesRates(){
        try{
            const coinsFixed = await this.coinRepository.find({where: {acronym: Not(CoinEnum.SATS)}})
            const acronymCoins = coinsFixed.map((coin) => coin.acronym).join(',')
            const crcRate = await this.getCRCExchangeRates()
            const config = {
                method: 'GET',
                url: 'https://currency-converter5.p.rapidapi.com/currency/convert',
                params: { format: 'json', from: 'USD', to: acronymCoins, amount: '1' },
                headers: {
                  'X-RapidAPI-Key': process.env.EXCHANGE_RATE_KEY,
                  'X-RapidAPI-Host': 'currency-converter5.p.rapidapi.com'
                }
              };
           const response = await axios(config)
           .then((re) => re.data.rates)
           .catch((error) => Sentry.captureException(error))
           Object.entries(response).forEach(([key, value]) => {
                coinsFixed.find((coin) => coin.acronym == key).exchangeRate = parseFloat(parseFloat(value['rate']).toFixed(2))
                coinsFixed.find((coin) => coin.acronym == 'CRC').exchangeRate = crcRate.sell
            });
            await this.coinRepository.save(coinsFixed)            
            const coinRates = []
            const historicRate = this.historicRateRepository.create({})
            await this.historicRateRepository.insert(historicRate)
            for(let i=0; i<coinsFixed.length; i++){
                coinRates.push({
                    coin: coinsFixed[i],
                    historicRate: historicRate,
                    exchangeRate: coinsFixed[i].exchangeRate
                })
            }
            const coinRatesCreated = this.historicCoinRateRepository.create(coinRates)
            await this.historicCoinRateRepository.insert(coinRatesCreated)
            const coins = await this.coinRepository.find({where: {acronym: Not('USDT')}});
            await this.redisService.setKeyValue('coins',JSON.stringify(coins))
            await this.cachLastHistoricRateId()
        }catch(error){
            Sentry.captureException(error)
            this.logger.error(`ACTION: Update Exchanges Rates, STATUS: FAILED, REASON: ${error.toString()}`)
        }
    }

    async getBtcPrice() {
        return await this.ibexService.getBtcExchangeRate()
    }

    async getGTQExchangeRate(){
        try {
            const config = {
                method: 'GET',
                url: 'https://currency-converter5.p.rapidapi.com/currency/convert',
                params: { format: 'json', from: 'USD', to: 'GTQ', amount: '1' },
                headers: {
                  'X-RapidAPI-Key': process.env.EXCHANGE_RATE_KEY,
                  'X-RapidAPI-Host': 'currency-converter5.p.rapidapi.com'
                }
            };
            const response = await axios(config)
            return new Decimal(response.data.rates.GTQ.rate).toNumber().toFixed(2)
        } catch (error) {
            Sentry.captureException(error)
            this.logger.error(`ACTION: Get GTQ Exchange Rate, STATUS: FAILED, REASON: ${error.toString()}`)
            throw error;
        }
    }


    async getAll(){
        // const coinsCached = await this.redisService.getKeyValue('coins')
        // if(coinsCached){
        //     return JSON.parse(coinsCached)
        // }
        const coins = await this.coinRepository.find({where: {isActive: true}});
        return coins.filter((coin) => coin.acronym != 'USDT')
    }
}

