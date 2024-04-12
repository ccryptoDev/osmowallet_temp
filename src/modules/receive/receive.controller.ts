import { Controller,ClassSerializerInterceptor,UseGuards,UseInterceptors,Req,Post,Get,Body,Query, UploadedFile } from '@nestjs/common';
import { AccessTokenGuard } from 'src/modules/auth/guards/accessToken.guard';
import { ScanDto } from './dtos/scan.dto';
import { ReceiveService } from './receive.service';
import { Request } from 'express';
import { InvoiceDto, InvoiceDtoV2 } from './dtos/invoice.dto';
import { AuthUser } from '../auth/payloads/auth.payload';
import { EstimateScanToReceiveDto } from './dtos/estimate.dto';
import { ReceiveDto } from './dtos/receive.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import EncrypterHelper from 'src/common/helpers/encrypter.helper';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('receive')
export class ReceiveController {

    constructor (
        private receiveService: ReceiveService,
        private encrypterService: EncrypterHelper
    ){}

    @UseInterceptors(FileInterceptor('file', { fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return callback(new Error('Only image files are allowed!'), false);
        }
        callback(null, true);
    }}))
    @Post('/via-link')
    receiveViaLink(@Body() body: ReceiveDto, @UploadedFile() file: Express.Multer.File){
        return this.receiveService.receiveViaLink(body,file)
    }

    @UseGuards(AccessTokenGuard)
    @Get('/scan/estimate')
    estimateScanToReceive(@Query() query: EstimateScanToReceiveDto){
      return this.receiveService.estimateScanToReceive(query)  
    }

    @UseGuards(AccessTokenGuard)
    @Post('/scan')
    async scanToReceive(@Req() req: Request, @Body() data: ScanDto){
        const rocketDecrypted = await this.encrypterService.decryptRocket(data.rocket)
        data.btcPrice = Number(rocketDecrypted)
        const authUser: AuthUser = {sub: req.user['sub']}
        return this.receiveService.scanToReceive(authUser,data)
    }

    @UseGuards(AccessTokenGuard)
    @Post('/generate-invoice')
    async generateInvoice(@Req() req: Request,@Body() data: InvoiceDto){
        const authUser: AuthUser = {sub: req.user['sub']}
        return this.receiveService.generateInvoice(authUser,data)
    }

    @UseGuards(AccessTokenGuard)
    @Post('/generate-invoice/v2')
    async generateInvoiceV2(@Req() req: Request,@Body() data: InvoiceDtoV2){
        const rocketDecrypted = await this.encrypterService.decryptRocket(data.rocket)
        data.btcPrice = Number(rocketDecrypted)
        const authUser: AuthUser = {sub: req.user['sub']}
        return this.receiveService.generateInvoice(authUser,data)
    }
}
