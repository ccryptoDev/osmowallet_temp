import { MigrationInterface, QueryRunner } from "typeorm";

export class FeeSource1711980529224 implements MigrationInterface {
    name = 'FeeSource1711980529224'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction_fees" ADD "source" varchar NOT NULL DEFAULT 'OSMO'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction_fees" DROP COLUMN "source"`);
    }

}
