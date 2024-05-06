import { MigrationInterface, QueryRunner } from "typeorm";

export class DeleteTest11703462432848 implements MigrationInterface {
    name = 'DeleteTest11703462432848'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account_deletions" DROP COLUMN "test1"`);
        await queryRunner.query(`ALTER TABLE "account_deletions" DROP COLUMN "test2"`);
        
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account_deletions" ADD "test2" varchar NOT NULL`);
        await queryRunner.query(`ALTER TABLE "account_deletions" ADD "test1" varchar NOT NULL`);
    }

}
