import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Log } from 'src/common/loggers/decorator.logger';
import { Coin } from 'src/entities/coin.entity';
import { Tier } from 'src/entities/tier.entity';
import { TierUser } from 'src/entities/tierUser.entity';
import { Transaction } from 'src/entities/transaction.entity';
import { Wallet } from 'src/entities/wallet.entity';
import { In, Repository } from 'typeorm';

@Injectable()
export class TiersService {

    constructor(
        @InjectRepository(Tier) private tierRepository: Repository<Tier>,
        @InjectRepository(TierUser) private tierUserRepository: Repository<TierUser>
    ){}

    
    /**
     * This function updates the tier of a user.
     * It first checks if the provided tierId is valid, if not it throws a BadRequestException.
     * Then it checks if the provided userId is valid, if not it throws a BadRequestException.
     * If both are valid, it updates the user's tier and saves the changes in the repository.
     * 
     * @param userId - The id of the user whose tier is to be updated.
     * @param tierId - The id of the new tier to be assigned to the user.
     * @throws BadRequestException - If the provided tierId or userId is invalid.
     */
    async updateTierUser(userId: string, tierId: string){
        const tier = await this.tierRepository.findOneBy({id: tierId})
        if(!tier) throw new BadRequestException('Invalid tier')
        const tierUser = await this.tierUserRepository.findOne({
            where: {
                user: {id: userId}
            }
        })
        if(!tierUser) throw new BadRequestException('Invalid user')
        tierUser.tier = tier
        await this.tierUserRepository.save(tierUser)
    }
    

    async getTiers() {
        return await this.tierRepository.find()
    }

    
    async getTierByUserId(id: string) {
        return await this.tierUserRepository.findOne({
            relations: {
                tier: true
            },
            where: {
                user: {id: id}
            }
        })
    }

}
