import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Autoconvert } from 'src/entities/autoconvert.entity';
import { Repository } from 'typeorm';
import { AuthUser } from '../auth/payloads/auth.payload';
import { AutoConvertDto } from './dtos/autoconvert.dto';
import { Coin } from 'src/entities/coin.entity';
import { User } from 'src/entities/user.entity';
import { CoinEnum } from '../me/enums/coin.enum';

@Injectable()
export class AutoconvertService {

    constructor(
        @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(Autoconvert) private autoconvertRepository: Repository<Autoconvert>,
        @InjectRepository(Coin) private coinRepository: Repository<Coin>,
    ){}

    async getAutoConvert(authUser: AuthUser){
        try{
            const record = await this.autoconvertRepository.findOne({
                relations: {coin: true},
                where: {user: {id: authUser.sub}}
            })
            return record
        }catch(error){
            throw error
        }
    }

    async updateAutoconvert(authUser: AuthUser, data: AutoConvertDto){
        try{
            let autoconvertRecord = await this.autoconvertRepository.findOneBy({user: {id: authUser.sub}})

            const coin = await this.coinRepository.findOneBy({id: data.coinId})
            if(!coin) throw new BadRequestException('Invalid coin')

            if(!Object.values(CoinEnum).includes(coin.acronym as CoinEnum)) throw new BadRequestException('Invalid coin')

            const user = await this.userRepository.findOneBy({id: authUser.sub})
            if(!autoconvertRecord){
                autoconvertRecord =  this.autoconvertRepository.create({
                    coin: coin,
                    percent: data.percent,
                    user: user
                })
            }else{
                autoconvertRecord.coin = coin
                autoconvertRecord.percent = data.percent
                autoconvertRecord.isActive = data.isActive
            }
            await this.autoconvertRepository.save(autoconvertRecord)
        }catch(error){
            throw error
        }
    }

}
