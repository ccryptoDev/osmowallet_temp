import { MigrationInterface, QueryRunner } from "typeorm";

export class KycStep1704914960310 implements MigrationInterface {
    name = 'KycStep1704914960310'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "kyc_verification_steps" DROP CONSTRAINT "FK_c07b18c692f32638250f717a5f2"`);
        // await queryRunner.query(`DROP INDEX "kyc_verification_steps"@"IDX_c07b18c692f32638250f717a5f" CASCADE`);
        // await queryRunner.query(`ALTER TABLE "kyc_verification_steps" RENAME COLUMN "kyc_step_id" TO "step"`);
        // await queryRunner.query(`ALTER TABLE "tiers" DROP COLUMN "from"`);
        // await queryRunner.query(`ALTER TABLE "tiers" DROP COLUMN "to"`);
        
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // await queryRunner.query(`ALTER TABLE "tiers" ADD "to" decimal(15,2) NOT NULL DEFAULT (0)`);
        // await queryRunner.query(`ALTER TABLE "tiers" ADD "from" decimal(15,2) NOT NULL DEFAULT (0)`);
        // await queryRunner.query(`ALTER TABLE "kyc_verification_steps" RENAME COLUMN "step" TO "kyc_step_id"`);
        // await queryRunner.query(`CREATE INDEX "IDX_c07b18c692f32638250f717a5f" ON "kyc_verification_steps" ("kyc_step_id") `);
        await queryRunner.query(`ALTER TABLE "kyc_verification_steps" ADD CONSTRAINT "FK_c07b18c692f32638250f717a5f2" FOREIGN KEY ("kyc_step_id") REFERENCES "kyc_steps"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
