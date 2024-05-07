import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';

@Injectable()
export class MetamapGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        // A sample webhook coming from MetaMap
        const WEBHOOK_PAYLOAD = request.body;

        const MERCHANT_SECRET = process.env.KYC_WEBHOOK_SECRET ?? '';

        // MetaMap hashes your webhook payload
        const signature = createHmac('sha256', MERCHANT_SECRET).update(JSON.stringify(WEBHOOK_PAYLOAD)).digest('hex');

        const isValidPayload = this.verify(signature, MERCHANT_SECRET, JSON.stringify(WEBHOOK_PAYLOAD));

        if (!isValidPayload) throw new UnauthorizedException();
        return isValidPayload;
    }

    verify(signature: string, secret: string, payloadBody: any) {
        const hash = createHmac('sha256', secret);
        const hashedPayload = hash.update(payloadBody).digest('hex');
        return timingSafeEqual(Buffer.from(hashedPayload), Buffer.from(signature));
    }
}
