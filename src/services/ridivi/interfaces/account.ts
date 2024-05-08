interface Account {
    NomPropietario: string;
    SaldoDisponible: number;
    CodigoMoneda: string;
}

export interface RidiviAccountResponse {
    account: Account;
    error: boolean;
}
