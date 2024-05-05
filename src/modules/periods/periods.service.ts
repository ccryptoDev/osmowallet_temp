import { Injectable,BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Period } from 'src/entities/period.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PeriodsService {
    constructor(
        @InjectRepository(Period) private periodRepository: Repository<Period>
    ){}

    async getPeriods(){
        try{
            const periods = await this.periodRepository.find()
            return periods
        }catch(error){
            throw new BadRequestException('Error getting periods')
        }
    }
}
