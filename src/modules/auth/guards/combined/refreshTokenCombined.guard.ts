import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { RefreshTokenGuard } from '../refreshToken.guard';
import { PartnerRefreshTokenGuard } from '../partnerRefreshToken.guard';

@Injectable()
export class RefreshTokenCombinedGuard implements CanActivate {
  constructor(private readonly authGuard: RefreshTokenGuard, private readonly partnerRefreshTokenGuard: PartnerRefreshTokenGuard) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      await this.authGuard.canActivate(context);
      return true;
    } catch (authError) {
      try {
        await this.partnerRefreshTokenGuard.canActivate(context);
        return true;
      } catch (adminError) {
        // Handle the errors here, e.g. log them or return an appropriate response
        return false;
      }
    }
  }
}
