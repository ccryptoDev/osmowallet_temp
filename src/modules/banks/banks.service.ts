import { Injectable,BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Bank } from 'src/entities/bank.entity';
import { OsmoBankAccount } from 'src/entities/osmoBank.entity';
import { Repository } from 'typeorm';
import { OsmoBankAccountQueryDto } from './dtos/osmoBankAccount.dto';

@Injectable()
export class BankService {
    constructor(
        @InjectRepository(Bank) private bankRepository: Repository<Bank>,
        @InjectRepository(OsmoBankAccount) private osmoBankAccountsRepository: Repository<OsmoBankAccount>,
    ){}
    
    
    
    async getAllBanks(){
        try{
            const banks = await this.bankRepository.find()
            return banks;
        }catch(error){
            throw new BadRequestException('Error getting banks')
        }
    }

    async getOsmoBankAccounts(data: OsmoBankAccountQueryDto) {
        return await this.osmoBankAccountsRepository.find({relations: {
            bank: true,
            coin: true
        },
        where: {
            coin:{
                id: data.coinId
            }
        }})
    }


}
