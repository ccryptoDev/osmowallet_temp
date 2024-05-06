import { MigrationInterface, QueryRunner } from "typeorm";

export class ReferralSource1713987183120 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "referral_source" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "source_name" varchar NOT NULL, PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "referral_source"`);
    }

}
