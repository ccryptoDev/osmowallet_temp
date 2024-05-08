export interface StrikeEventUpdate {
    id: string;
    eventType: string;
    webhookVersion: string;
    data: {
        entityId: string;
        changes?: string[];
    };
    created: string;
    deliverySuccess: boolean;
}
