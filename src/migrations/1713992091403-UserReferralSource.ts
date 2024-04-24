import { MigrationInterface, QueryRunner } from "typeorm";

export class UserReferralSource1713992091403 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_referral_source" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "user_id" varchar NOT NULL, "referral_source_id" varchar NOT NULL, PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "user_referral_source"`);
    }

}
