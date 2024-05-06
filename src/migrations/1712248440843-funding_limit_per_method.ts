import { MigrationInterface, QueryRunner } from "typeorm";

export class FundingLimitPerMethod1712248440843 implements MigrationInterface {
    name = 'FundingLimitPerMethod1712248440843'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "tier_fundings" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "fee" decimal(15,3) NOT NULL DEFAULT (0), "min" decimal(15,2) NOT NULL DEFAULT (0), "max" decimal(15,2) NOT NULL DEFAULT (0), "daily_limit" decimal(15,2) NOT NULL DEFAULT (0), "monthly_limit" decimal(15,2) NOT NULL DEFAULT (0), "is_active" bool NOT NULL DEFAULT false, "funding_method_id" uuid, "tier_id" uuid, CONSTRAINT "PK_f09b6f6bc66c3a654b9ea142e4f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0870468bdc47b9e6b6d3b9b682" ON "tier_fundings" ("funding_method_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_b002cac2d94c09f8a073d7aa1e" ON "tier_fundings" ("tier_id") `);
        await queryRunner.query(`CREATE TABLE "funding_transaction_limits" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "daily_amassed_amount" decimal(15,2) NOT NULL DEFAULT (0), "monthly_amassed_amount" decimal(15,2) NOT NULL DEFAULT (0), "user_id" uuid, "fundingmethod_id" uuid, CONSTRAINT "PK_2fb01fecb92082f984c4d96c3c6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_47c92aa6b7e5434da1520331d3" ON "funding_transaction_limits" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_dae6e1c923925d12e5da435630" ON "funding_transaction_limits" ("fundingmethod_id") `);
        await queryRunner.query(`ALTER TABLE "tier_fundings" ADD CONSTRAINT "FK_0870468bdc47b9e6b6d3b9b6828" FOREIGN KEY ("funding_method_id") REFERENCES "funding_methods"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tier_fundings" ADD CONSTRAINT "FK_b002cac2d94c09f8a073d7aa1eb" FOREIGN KEY ("tier_id") REFERENCES "tiers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "funding_transaction_limits" ADD CONSTRAINT "FK_47c92aa6b7e5434da1520331d3a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "funding_transaction_limits" ADD CONSTRAINT "FK_dae6e1c923925d12e5da4356306" FOREIGN KEY ("fundingmethod_id") REFERENCES "funding_methods"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "funding_transaction_limits" DROP CONSTRAINT "FK_dae6e1c923925d12e5da4356306"`);
        await queryRunner.query(`ALTER TABLE "funding_transaction_limits" DROP CONSTRAINT "FK_47c92aa6b7e5434da1520331d3a"`);
        await queryRunner.query(`DROP INDEX "funding_transaction_limits"@"IDX_dae6e1c923925d12e5da435630" CASCADE`);
        await queryRunner.query(`DROP INDEX "funding_transaction_limits"@"IDX_47c92aa6b7e5434da1520331d3" CASCADE`);
        await queryRunner.query(`DROP TABLE "funding_transaction_limits"`);
        await queryRunner.query(`DROP INDEX "tier_fundings"@"IDX_b002cac2d94c09f8a073d7aa1e" CASCADE`);
        await queryRunner.query(`DROP INDEX "tier_fundings"@"IDX_0870468bdc47b9e6b6d3b9b682" CASCADE`);
        await queryRunner.query(`DROP TABLE "tier_fundings"`);
    }

}
