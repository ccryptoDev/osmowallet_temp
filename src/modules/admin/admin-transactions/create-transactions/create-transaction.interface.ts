export interface AdminTransaction {
    validateData(): Promise<void>;
    create(): Promise<void>;
}
