import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
const crypto = require('crypto');

@Injectable()
export class MetamapGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
      const request = context.switchToHttp().getRequest();
      // A sample webhook coming from MetaMap
      const WEBHOOK_PAYLOAD = request.body
      
      const MERCHANT_SECRET = process.env.KYC_WEBHOOK_SECRET;

      // MetaMap hashes your webhook payload
      const signature = crypto.createHmac('sha256', MERCHANT_SECRET).update(JSON.stringify(WEBHOOK_PAYLOAD)).digest('hex');
      
             
      const isValidPayload = this.verify(signature, MERCHANT_SECRET, JSON.stringify(WEBHOOK_PAYLOAD));

      if(!isValidPayload) throw new UnauthorizedException()
      return isValidPayload;      
    }

    verify(signature: string, secret: string, payloadBody: any) {
        let hash = crypto.createHmac('sha256', secret);
        hash = hash.update(payloadBody).digest('hex');
        return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
    } 
  }
