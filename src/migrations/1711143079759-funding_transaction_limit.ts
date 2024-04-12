import { MigrationInterface, QueryRunner } from "typeorm";

export class FundingTransactionLimit1711143079759 implements MigrationInterface {
    name = 'FundingTransactionLimit1711143079759'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "funding_transaction_limits" ADD "monthly_amassed_amount" decimal(15,2) NOT NULL DEFAULT (0)`);
        await queryRunner.query(`ALTER TABLE "funding_transaction_limits" DROP CONSTRAINT "FK_ff04e7b4c1066344e10e4e72987"`);
        await queryRunner.query(`ALTER TABLE "funding_transaction_limits" DROP CONSTRAINT "FK_dae6e1c923925d12e5da4356306"`);
        await queryRunner.query(`ALTER TABLE "funding_transaction_limits" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "funding_transaction_limits" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "funding_transaction_limits" ADD CONSTRAINT "FK_ff04e7b4c1066344e10e4e72987" FOREIGN KEY ("tier_id") REFERENCES "tiers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "funding_transaction_limits" ADD CONSTRAINT "FK_dae6e1c923925d12e5da4356306" FOREIGN KEY ("fundingmethod_id") REFERENCES "funding_methods"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "funding_transaction_limits" DROP CONSTRAINT "FK_dae6e1c923925d12e5da4356306"`);
        await queryRunner.query(`ALTER TABLE "funding_transaction_limits" DROP CONSTRAINT "FK_ff04e7b4c1066344e10e4e72987"`);
        await queryRunner.query(`ALTER TABLE "funding_transaction_limits" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "funding_transaction_limits" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(`ALTER TABLE "funding_transaction_limits" ADD CONSTRAINT "FK_dae6e1c923925d12e5da4356306" FOREIGN KEY ("fundingmethod_id") REFERENCES "funding_methods"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "funding_transaction_limits" ADD CONSTRAINT "FK_ff04e7b4c1066344e10e4e72987" FOREIGN KEY ("tier_id") REFERENCES "tiers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "funding_transaction_limits" DROP COLUMN "monthly_amassed_amount"`);
    }

}
