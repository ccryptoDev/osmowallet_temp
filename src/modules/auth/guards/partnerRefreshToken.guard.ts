import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class PartnerRefreshTokenGuard extends AuthGuard('partner-jwt-refresh') {}
