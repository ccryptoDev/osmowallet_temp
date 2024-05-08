import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReferralSource } from './entities/referral.source.entity';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(ReferralSource) private referralSourceRepository: Repository<ReferralSource>,
  ) {}

  async getReferralSource () {
    return await this.referralSourceRepository.find({
      select: ['id','source_name'],
    });
  }
}
