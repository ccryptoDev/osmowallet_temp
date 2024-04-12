import { MigrationInterface, QueryRunner } from "typeorm";

export class TwofaField1709744934139 implements MigrationInterface {
    name = 'TwofaField1709744934139'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "is_2fa_enabled" bool DEFAULT false`);
       
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_2fa_enabled"`);
    }

}
