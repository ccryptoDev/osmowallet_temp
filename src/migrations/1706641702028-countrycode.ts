import { MigrationInterface, QueryRunner } from "typeorm";

export class Countrycode1706641702028 implements MigrationInterface {
    name = 'Countrycode1706641702028'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "country_coins" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "country_code" varchar NOT NULL DEFAULT 'GT', "coin_id" uuid, CONSTRAINT "PK_85560a720b7fd595576339615e5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c676fcca1a8ffef876f92d150c" ON "country_coins" ("coin_id") `);
       
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "country_coins"@"IDX_c676fcca1a8ffef876f92d150c" CASCADE`);
        await queryRunner.query(`DROP TABLE "country_coins"`);
    }

}
