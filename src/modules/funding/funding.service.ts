import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Decimal from 'decimal.js';
import { TransactionMethodEnum } from 'src/common/enums/transactionMethod.enum';
import { TierFunding } from 'src/entities/tierFunding.entity';
import { User } from 'src/entities/user.entity';
import { GoogleCloudTasksService } from 'src/services/google-cloud-tasks/google-cloud-tasks.service';
import { In, Repository } from 'typeorm';
import { GoogleCloudStorageService } from '../../services/google-cloud-storage/google-cloud-storage.service';
import { AuthUser } from '../auth/payloads/auth.payload';
import { CardService } from '../card/card.service';
import { SendGridService } from '../send-grid/send-grid.service';
import { SolfinService } from '../solfin/solfin.service';
import { FundingDto } from './dtos/funding.dto';
import { FundingMethodEnum } from './enums/fundingMethod.enum';
import { OnvoCheckoutSuccess } from './interfaces/onvo.checkout.success';
import { CashInFunding } from './strategies/cash-in.strategy';
import { Funding } from './strategies/funding';
import { FundingContext } from './strategies/funding.context';
import { OnvoFunding } from './strategies/onvo.strategy';
import { OsmoBankFunding } from './strategies/osmoFunding.strategy';
import { SolfinFunding } from './strategies/solfin.strategy';
import { StableFunding } from './strategies/stable-funding.strategy';
import { TierUser } from 'src/entities/tierUser.entity';


@Injectable()
export class FundingService {
    constructor(
        @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(TierFunding) private tierFundingRepository: Repository<TierFunding>,
        @InjectRepository(TierUser) private tierUserRepository: Repository<TierUser>,
        private googleCloudStorageService: GoogleCloudStorageService,
        private sendGridService: SendGridService,
        private solfinService: SolfinService,
        private cardService: CardService,
        private googleTaskService: GoogleCloudTasksService
    ){}

    async getAllFundingMethods(){
        const fundingMethods = await this.tierFundingRepository.find({
            relations: {
                fundingMethod:{
                    availableCoins: {
                        coin: true,
                    }
                }
            }
        })
        return fundingMethods
    }

    async createOnvoFundingTransaction(body: OnvoCheckoutSuccess){
        console.log(body)
        if(body.type == 'payment-intent.succeeded'){
            if(body.data.metadata && body.data.metadata['userId']){
                const user = await this.userRepository.findOneBy({
                    id: body.data.metadata['userId']
                })
                if(user){
                    const strategy = new OnvoFunding(
                        user,
                        this.userRepository.manager,
                        this.googleTaskService,
                        body
                    )
                    await strategy.pay()
                }
            }
        }
    }

    async getFundingMethods(authUser: AuthUser) {
        const user = await this.userRepository.findOne({
            where: {
                id: authUser.sub,
            }
        })
        
        const userTier = await this.tierUserRepository.findOne({
            where: { user: { id: authUser.sub } },
            relations: { tier: true },
        });

        const tierFundingMethods = await this.tierFundingRepository.find({
            relations: {
                fundingMethod: {
                    availableCoins: {
                        coin: true,
                    },
                },
            },
                
            where: {
                tier: {id: userTier.tier.id},
                fundingMethod: {
                    isActive: true,
                    countries: {
                        isActive: true,
                        countryCode: In([user.residence, 'WORLD']),
                    },
                },
            },
        });
        const tierFundingMethodsModified = tierFundingMethods.map((tierFunding) => {
            tierFunding.fundingMethod['coins'] = tierFunding.fundingMethod.availableCoins.map((coin) => coin.coin)
            tierFunding.fundingMethod['min'] = tierFunding.min
            tierFunding.fundingMethod['max'] = tierFunding.max
            tierFunding.fundingMethod['fee'] = tierFunding.fee
            delete tierFunding.fundingMethod.availableCoins
            return tierFunding.fundingMethod
        })
        return tierFundingMethodsModified
    }

    async fund(authUser: AuthUser, body: FundingDto, file?: Express.Multer.File){
        const tierFundingMethods = await this.tierFundingRepository.findOne({
            relations: {
                fundingMethod: {
                    availableCoins: {
                        coin: true,
                    },
                }
            },
            where: {
                fundingMethod: {
                    id: body.fundingMethodId
                },
            }
        })
        if(!tierFundingMethods.fundingMethod) throw new BadRequestException('Invalid funding method')
        const isCoinValid = tierFundingMethods.fundingMethod.availableCoins.find(availableCoin => availableCoin.coin.id === body.coinId)
        if(!isCoinValid) throw new BadRequestException('Coin not valid for this funding method')
        const user = await this.userRepository.findOneBy({id: authUser.sub })
        const manager = this.userRepository.manager
        let strategy: Funding
        if(tierFundingMethods.fundingMethod.name === TransactionMethodEnum.TRANSFER || tierFundingMethods.fundingMethod.name === TransactionMethodEnum.CASH_IN){
            strategy = new OsmoBankFunding(manager,user,body,this.googleCloudStorageService,this.sendGridService,file, tierFundingMethods.fundingMethod)
        }
        if(tierFundingMethods.fundingMethod.name === FundingMethodEnum.STABLE_COIN){       
            strategy = new StableFunding(this.googleCloudStorageService,this.sendGridService,body,manager,user,file,this.googleTaskService)
        }
        if(tierFundingMethods.fundingMethod.name === FundingMethodEnum.TRANSFER_SOLFIN) {
            strategy = new SolfinFunding(body,user,manager, this.solfinService)
        }
        if(tierFundingMethods.fundingMethod.name === FundingMethodEnum.CREDIT_CARD){
            const amount = new Decimal(new Decimal(body.amount).plus(new Decimal(body.amount).times(tierFundingMethods.fundingMethod.fee)).plus(0.25).toFixed(2)).toNumber()
            console.log('amount ',amount)
            body.amount = amount
            strategy = new OnvoFunding(user,manager,this.googleTaskService,null,this.cardService,body)
        }
        if(tierFundingMethods.fundingMethod.name === FundingMethodEnum.AKISI){
            strategy = new CashInFunding(manager, user, body)
        }
        if(strategy){
            const context = new FundingContext(strategy)
            await context.fund()
        }
    }
}