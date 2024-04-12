import { MigrationInterface, QueryRunner } from "typeorm";

export class Name1709216458018 implements MigrationInterface {
    name = 'Name1709216458018'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "kyc_verifications" ALTER COLUMN "status" SET DEFAULT 'CREATED'`);
        await queryRunner.query(`ALTER TABLE "kyc_verification_steps" ALTER COLUMN "error" SET DEFAULT 'no ejecutado'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        
    }

}
