import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';


@Injectable()
export class PartnerAccessTokenStrategy extends PassportStrategy(Strategy, 'partner-jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.PARTNER_ACCESS_SECRET,
      passReqToCallback: true,
    });
  }

  validate(req: Request,payload: any) {
    return payload;
  }
}
