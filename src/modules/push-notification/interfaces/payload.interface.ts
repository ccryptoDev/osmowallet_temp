import { MobileRoutePaths } from '../enums/mobileRoutesPaths.enum';

export interface PushPayload {
    title: string;
    message: string;
    data?: {
        route?: MobileRoutePaths;
        currency?: string;
        amount?: string;
    };
}
