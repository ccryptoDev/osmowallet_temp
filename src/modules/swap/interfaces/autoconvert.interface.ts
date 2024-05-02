import { AuthUser } from 'src/modules/auth/payloads/auth.payload';

export interface AutoconvertToReceivePayload {
    authUser: AuthUser;
    fromCoinId: string;
    toCoinId: string;
    btcPrice: number;
    satsToSell: number;
    totalSats: number;
}
