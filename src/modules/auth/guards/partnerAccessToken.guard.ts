import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class PartnerAccessTokenGuard extends AuthGuard('partner-jwt') {}
