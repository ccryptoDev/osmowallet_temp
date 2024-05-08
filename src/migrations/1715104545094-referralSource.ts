import { MigrationInterface, QueryRunner } from "typeorm";

export class ReferralSource1715104545094 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_referral_source" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "email" varchar, "mobile" varchar, "referralSources" varchar, CONSTRAINT "UQ_a47ef1fd38cd63a17c97efacd30" UNIQUE ("email"), CONSTRAINT "UQ_2d83dbd9c2ce1b286290f93ffe5" UNIQUE ("mobile"), CONSTRAINT "PK_d5a4adfcf418acad59de20ae253" PRIMARY KEY ("id"))`);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "user_referral_source"`);
    }

}
