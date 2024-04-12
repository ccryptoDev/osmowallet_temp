import { MigrationInterface, QueryRunner } from "typeorm";

export class PeriodIdDroppedFromRecurrentBuys1709569413449 implements MigrationInterface {
    name = 'PeriodIdDroppedFromRecurrentBuys1709569413449'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recurrent_buys" DROP CONSTRAINT "FK_5a483a562cf5a73fa65febf5d04"`);
        await queryRunner.query(`DROP INDEX "recurrent_buys"@"IDX_5a483a562cf5a73fa65febf5d0" CASCADE`);
        await queryRunner.query(`ALTER TABLE "recurrent_buys" DROP COLUMN "days"`);
        await queryRunner.query(`ALTER TABLE "recurrent_buys" ADD "days" int2 NOT NULL`);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recurrent_buys" DROP COLUMN "days"`);
        await queryRunner.query(`ALTER TABLE "recurrent_buys" ADD "days" uuid`);
        await queryRunner.query(`ALTER TABLE "recurrent_buys" RENAME COLUMN "days" TO "period_id"`);
        await queryRunner.query(`CREATE INDEX "IDX_5a483a562cf5a73fa65febf5d0" ON "recurrent_buys" ("period_id") `);
        await queryRunner.query(`ALTER TABLE "recurrent_buys" ADD CONSTRAINT "FK_5a483a562cf5a73fa65febf5d04" FOREIGN KEY ("period_id") REFERENCES "periods"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
