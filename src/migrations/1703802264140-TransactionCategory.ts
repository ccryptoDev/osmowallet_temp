import { MigrationInterface, QueryRunner } from "typeorm";

export class TransactionCategory1703802264140 implements MigrationInterface {
    name = 'TransactionCategory1703802264140'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bank_accounts" DROP CONSTRAINT "FK_f4ce621bc399c5956762c553a75"`);
        await queryRunner.query(`ALTER TABLE "osmo_bank_accounts" DROP CONSTRAINT "FK_3de7b6f94193ef505188eaa38b9"`);
        await queryRunner.query(`DROP INDEX "bank_accounts"@"IDX_f4ce621bc399c5956762c553a7" CASCADE`);
        await queryRunner.query(`DROP INDEX "osmo_bank_accounts"@"IDX_3de7b6f94193ef505188eaa38b" CASCADE`);
        await queryRunner.query(`ALTER TABLE "bank_accounts" RENAME COLUMN "bank_account_type_id" TO "account_type"`);
        await queryRunner.query(`ALTER TABLE "osmo_bank_accounts" RENAME COLUMN "bank_account_type_id" TO "account_type"`);
        await queryRunner.query(`ALTER TABLE "banks" DROP COLUMN "usd_code"`);
        await queryRunner.query(`ALTER TABLE "banks" DROP COLUMN "gtq_code"`);
        await queryRunner.query(`ALTER TABLE "banks" ADD "code" int8 NOT NULL DEFAULT (0)`);
        await queryRunner.query(`ALTER TABLE "transaction_categories" ADD "color" varchar NOT NULL DEFAULT '#FF779ECB'`);
        
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction_categories" DROP COLUMN "color"`);
        await queryRunner.query(`ALTER TABLE "banks" DROP COLUMN "code"`);
        await queryRunner.query(`ALTER TABLE "banks" ADD "gtq_code" int8 NOT NULL`);
        await queryRunner.query(`ALTER TABLE "banks" ADD "usd_code" int8 NOT NULL`);
        await queryRunner.query(`ALTER TABLE "osmo_bank_accounts" RENAME COLUMN "account_type" TO "bank_account_type_id"`);
        await queryRunner.query(`ALTER TABLE "bank_accounts" RENAME COLUMN "account_type" TO "bank_account_type_id"`);
        await queryRunner.query(`CREATE INDEX "IDX_3de7b6f94193ef505188eaa38b" ON "osmo_bank_accounts" ("bank_account_type_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_f4ce621bc399c5956762c553a7" ON "bank_accounts" ("bank_account_type_id") `);
        await queryRunner.query(`ALTER TABLE "osmo_bank_accounts" ADD CONSTRAINT "FK_3de7b6f94193ef505188eaa38b9" FOREIGN KEY ("bank_account_type_id") REFERENCES "bank_account_types"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bank_accounts" ADD CONSTRAINT "FK_f4ce621bc399c5956762c553a75" FOREIGN KEY ("bank_account_type_id") REFERENCES "bank_account_types"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
