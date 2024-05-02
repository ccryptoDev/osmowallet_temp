import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { Address } from './entities/address.entity';
import { TransactionDetail } from './entities/transaction.detail.entity';
import { User } from './entities/user.entity';
import { GoogleCloudStorageService } from './services/google-cloud-storage/google-cloud-storage.service';
import { OsmoBusinessBpt } from './entities/osmoBusinessBPT.entity';
import { RedisService } from './common/services/redis/redis.service';
import { IbexService } from './modules/ibex/ibex.service';
import { IbexAccount } from './entities/ibex.account.entity';
import { ReferralSource } from './entities/referral.source.entity';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Role) private roleRepository: Repository<Role>,
    @InjectRepository(Address) private addressRepository: Repository<Address>,
    @InjectRepository(ReferralSource) private referralSourceRepository: Repository<ReferralSource>,
    @InjectRepository(TransactionDetail)
    private transactionDetailRepository: Repository<TransactionDetail>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(OsmoBusinessBpt)
    private osmoBptRepository: Repository<OsmoBusinessBpt>,
    @InjectRepository(IbexAccount) private ibexAccountRepository: Repository<IbexAccount>,
    private ibexService: IbexService,
    private googleCloudStorageService: GoogleCloudStorageService,
    private redisService: RedisService,
  ) {}
  
  async getReferralSource () {
    return await this.referralSourceRepository.find({
      select: ['id','source_name'],
    });
  }

}
