import { KycStatus } from '../enums/kycStatus.enum';

export interface RawKyc {
    verification: Verification;
    images: string[];
    liveness: Liveness;
    watchlists: Watchlist[];
    fields: Field[];
}

interface Verification {
    id: string;
    documentNumber: string;
    status: string;
    duplicated: boolean;
    verificationId: string;
    attemps: number;
    createdAt: string;
    updatedAt: string;
    verificationSteps: VerificationStep[];
}

interface VerificationStep {
    id: string;
    step: string;
    verified: boolean;
    error: null | string;
    createdAt: string;
    updatedAt: string;
}

interface Liveness {
    videoUrl: string;
    spriteUrl: string;
    selfieUrl: string;
}

interface Watchlist {
    name: string;
    result: null | string;
}

interface Field {
    name: string;
    value: string;
}

export interface MetaMapUser {
    documents: Array<{
        steps: Array<{
            id: string;
            data: {
                fullName: {
                    value: string;
                };
                relatedRecords: unknown[];
            };
        }>;
        country: string;
        photos: unknown[];
        fields: { [key: string]: { value: string } };
    }>;
    steps: Array<{ id: string; data: Array<{ watchlist: { name: string }; searchResult: string }> }>;
    identity: {
        status: KycStatus;
    };
}
