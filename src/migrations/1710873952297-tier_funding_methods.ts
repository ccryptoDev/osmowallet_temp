import { MigrationInterface, QueryRunner } from 'typeorm';

export class TierFundingMethods1710873952297 implements MigrationInterface {
    name = 'TierFundingMethods1710873952297';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tier_fundings" ADD "is_active" bool NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "tier_fundings" DROP CONSTRAINT "FK_0870468bdc47b9e6b6d3b9b6828"`);
        await queryRunner.query(`ALTER TABLE "tier_fundings" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "tier_fundings" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(
            `ALTER TABLE "tier_fundings" ADD CONSTRAINT "FK_0870468bdc47b9e6b6d3b9b6828" FOREIGN KEY ("funding_method_id") REFERENCES "funding_methods"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "tier_fundings" ADD CONSTRAINT "FK_b002cac2d94c09f8a073d7aa1eb" FOREIGN KEY ("tier_id") REFERENCES "tiers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tier_fundings" DROP CONSTRAINT "FK_b002cac2d94c09f8a073d7aa1eb"`);
        await queryRunner.query(`ALTER TABLE "tier_fundings" DROP CONSTRAINT "FK_0870468bdc47b9e6b6d3b9b6828"`);
        await queryRunner.query(`ALTER TABLE "tier_fundings" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "tier_fundings" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(
            `ALTER TABLE "tier_fundings" ADD CONSTRAINT "FK_0870468bdc47b9e6b6d3b9b6828" FOREIGN KEY ("funding_method_id") REFERENCES "funding_methods"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "tier_fundings" ADD CONSTRAINT "FK_b002cac2d94c09f8a073d7aa1eb" FOREIGN KEY ("tier_id") REFERENCES "tiers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(`ALTER TABLE "tier_fundings" DROP COLUMN "is_active"`);
    }
}
