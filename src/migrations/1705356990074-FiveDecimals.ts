import { MigrationInterface, QueryRunner } from 'typeorm';

export class FiveDecimals1705356990074 implements MigrationInterface {
    name = 'FiveDecimals1705356990074';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "preferences" ADD "promotional_notification" bool NOT NULL DEFAULT true`);

        await queryRunner.query(`ALTER TABLE "wallets" ALTER COLUMN "balance" TYPE decimal(15,5)`);
        await queryRunner.query(`ALTER TABLE "wallets" ALTER COLUMN "available_balance" TYPE decimal(15,5)`);

        await queryRunner.query(`ALTER TABLE "wallet_history" ALTER COLUMN "balance" TYPE decimal(15,5)`);
        await queryRunner.query(`ALTER TABLE "wallet_history" ALTER COLUMN "available_balance" TYPE decimal(15,5)`);

        await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "amount" TYPE decimal(15,5)`);
        await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "balance" TYPE decimal(15,5)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "balance" TYPE decimal(15,3)`);
        await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "amount" TYPE decimal(15,3)`);
        await queryRunner.query(`ALTER TABLE "wallet_history" ALTER COLUMN "available_balance" TYPE decimal(15,3)`);
        await queryRunner.query(`ALTER TABLE "wallet_history" ALTER COLUMN "balance" TYPE decimal(15,3)`);

        await queryRunner.query(`ALTER TABLE "wallets" ALTER COLUMN "available_balance" TYPE decimal(15,3)`);
        await queryRunner.query(`ALTER TABLE "wallets" ALTER COLUMN "balance" TYPE decimal(15,3)`);

        await queryRunner.query(`ALTER TABLE "preferences" DROP COLUMN "promotional_notification"`);
    }
}
