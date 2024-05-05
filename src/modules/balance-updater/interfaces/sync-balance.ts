
/**
 * Interface for synchronizing balance information when a user creates their bank account in a third-party system.
 */
export interface SyncBalance {
    /**
     * Unique identifier for the user.
     */
    userId: string;
    /**
     * Country code where the user's bank account is located.
     */
    country: string;
}

export interface SyncBalance {
    userId: string
    country: string
}