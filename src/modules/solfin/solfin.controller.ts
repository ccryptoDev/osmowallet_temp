import { Body, Controller, Post } from '@nestjs/common';
import { SolfinService } from './solfin.service';
import { SolfinCreateAccountPayload } from './dtos/createNewAccount.dto';
import { SolfinWithdrawPayload } from './interfaces/withdraw';
import { SolfingKycFormData } from '../kyc/interfaces/solfin.kyc.interface';

@Controller('solfin')
export class SolfinController {
    constructor(private solfinService: SolfinService){}

    @Post('/kyc')
    createSolfinKyc(@Body() body: SolfingKycFormData) {
        return this.solfinService.createForm(body)
    }

    @Post('/kyc/status')
    checkSolfinKyc(@Body() body: SolfinCreateAccountPayload) {
        return this.solfinService.getSolfinKycStatus(body)
    }

    @Post('/withdraw')
    withdraw(@Body() body: SolfinWithdrawPayload) {
        return this.solfinService.withdraw(body)
    }

    @Post('/person')
    createNewPersonFromKyc(@Body() body: SolfinCreateAccountPayload) {
        return this.solfinService.createNewPersonFromKyc(body)
    }

    @Post('/iban')
    createSolfinIbanAccount(@Body() body: SolfinCreateAccountPayload) {
        return this.solfinService.createSolfinIbanAccounts(body)
    }
}

