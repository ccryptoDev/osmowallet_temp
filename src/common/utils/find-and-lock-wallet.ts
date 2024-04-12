import { Wallet } from "src/entities/wallet.entity";
import { EntityManager } from "typeorm";



export interface FindAndLockWalletOptions {
    entityManager: EntityManager,
    coinId: string
    alias?: string
    userId?: string
}

export async function findAndLockWallet(options: FindAndLockWalletOptions){
    return await options.entityManager.findOne(Wallet, {
        where: {
            coin: {id: options.coinId},
            account: options.alias != null
            ? {alias: options.alias}
            : {user: {id: options.userId}}
        },
        lock: {mode: 'pessimistic_write',tables: ['wallets']}
    })
}