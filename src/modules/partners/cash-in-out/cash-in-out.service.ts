import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as otpGenerator from 'otp-generator';
import { OTP } from 'src/common/enums/otp.enum';
import { Partner } from 'src/common/enums/partner.enum';
import { FundingMethod } from 'src/entities/fundingMethod.entity';
import { Otp } from 'src/entities/otp.entity';
import { User } from 'src/entities/user.entity';
import { WithdrawalMethod } from 'src/entities/withdrawalMethod.entity';
import { AuthUser } from 'src/modules/auth/payloads/auth.payload';
import { FundingDto } from 'src/modules/funding/dtos/funding.dto';
import { FundingService } from 'src/modules/funding/funding.service';
import { CoinEnum } from 'src/modules/me/enums/coin.enum';
import { UsersService } from 'src/modules/users/users.service';
import { WithdrawDto } from 'src/modules/withdraw/dtos/withdraw.dto';
import { WithdrawService } from 'src/modules/withdraw/withdraw.service';
import { Repository } from 'typeorm';
import { GetUserbyPhoneOrEmailDto } from '../dtos/getUser.dto';
import { CashInDto } from './dtos/cash-in.dto';
import { CashOutDto } from './dtos/cash-out.dto';

@Injectable()
export class CashInOutService {
    constructor(
        @InjectRepository(FundingMethod)
        private fundingMethodRepository: Repository<FundingMethod>,
        @InjectRepository(WithdrawalMethod)
        private withdrawalMethodRepository: Repository<WithdrawalMethod>,
        @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(Otp) private otpRepository: Repository<Otp>,
        private fundingService: FundingService,
        private withdrawService: WithdrawService,
        private userService: UsersService,
    ) {}

    async getOTP(authUser: AuthUser) {
        const user = await this.userRepository.findOne({
            where: {
                id: authUser.sub
            }
        });
        if (!user) throw new NotFoundException('User not found');
        const otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            specialChars: false,
            digits: true,
            lowerCaseAlphabets: false,
        });

        const expiry = new Date();
        expiry.setMinutes(expiry.getMinutes() + 1);

        const otpRecord = this.otpRepository.create({
            user: user,
            otp: Number(otp),
            expiry: expiry,
            type: OTP.TRANSACTION,
        });
        await this.otpRepository.insert(otpRecord);

        return { token: otp };
    }

    async getUserbyPhoneOrEmail(queries: GetUserbyPhoneOrEmailDto) {
        const user = await this.userService.getUserbyPhoneOrEmail(queries)

        const fundingMethod = await this.fundingMethodRepository.findOne({
            where: {
              name: Partner.AKISI,
            },
        });

        const data = {
            user,
            minSendAmount: fundingMethod.min,
            maxSendAmount: fundingMethod.max,
        };

        return data;
    }

    async funding(authPartner: AuthUser, { email, phoneNumber, amount }: CashInDto) {
        const { user } = await this.getUserbyPhoneOrEmail({ email, phoneNumber })
        
        const fundingMethod = await this.fundingMethodRepository.findOne({
            where: {
                name: Partner.AKISI,
            },
            relations: { availableCoins: { coin: true} },
        });

        const data = {
            fundingMethodId: fundingMethod.id,
            amount,
            coinId: fundingMethod.availableCoins.find((method) => method.coin.acronym === CoinEnum.GTQ).coin.id,
            partner: authPartner.sub
        } satisfies FundingDto;
        
        await this.fundingService.fund({ sub: user.id }, data);
    }
    async withdraw(authPartner: AuthUser, { email, phoneNumber, ...body }: CashOutDto) {
        const { user } = await this.getUserbyPhoneOrEmail({ email, phoneNumber })
        
        const withdrawalMethod = await this.withdrawalMethodRepository.findOne({
            relations: { availableCoins: {coin: true} },
            where: {
              name: Partner.AKISI,
            },
        });
        
        const data = {
            withdrawMethodId: withdrawalMethod.id,
            amount: body.amount,
            coinId: withdrawalMethod.availableCoins.find(
                (method) => method.coin.acronym === CoinEnum.GTQ,
                ).coin.id,
            data: JSON.stringify({ token: body.data.token }),
            partner: authPartner.sub
        } satisfies WithdrawDto;

        await this.withdrawService.withdraw({ sub: user.id }, data);
    }
}
