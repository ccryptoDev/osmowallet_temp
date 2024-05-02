import { MigrationInterface, QueryRunner } from 'typeorm';

export class $npmConfigName1708541706477 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "otp_codes" ADD "type" varchar NOT NULL`);
    }

    public async down(): Promise<void> {}
}
