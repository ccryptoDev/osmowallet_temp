import { MigrationInterface, QueryRunner } from "typeorm";

export class Stillmanupdate1714769183528 implements MigrationInterface {
    name = 'Stillmanupdate1714769183528'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stillman_params" ADD "min_range" int8 NOT NULL`);
        await queryRunner.query(`ALTER TABLE "stillman_params" ADD "max_range" int8 NOT NULL`);
        await queryRunner.query(`ALTER TABLE "stillman_params" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "stillman_params" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        
        await queryRunner.query(`ALTER TABLE "stillman_params" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "stillman_params" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(`ALTER TABLE "stillman_params" DROP COLUMN "max_range"`);
        await queryRunner.query(`ALTER TABLE "stillman_params" DROP COLUMN "min_range"`);
    }

}
