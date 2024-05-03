import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AccessTokenGuard } from '../accessToken.guard';
import { PartnerAccessTokenGuard } from '../partnerAccessToken.guard';

@Injectable()
export class AccessTokenCombinedGuard implements CanActivate {
    constructor(
        private readonly accesTokenGuard: AccessTokenGuard,
        private readonly partnerAccessTokenGuard: PartnerAccessTokenGuard,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            await this.accesTokenGuard.canActivate(context);
            return true;
        } catch (authError) {
            try {
                await this.partnerAccessTokenGuard.canActivate(context);
                return true;
            } catch (adminError) {
                // Handle the errors here, e.g. log them or return an appropriate response
                return false;
            }
        }
    }
}
