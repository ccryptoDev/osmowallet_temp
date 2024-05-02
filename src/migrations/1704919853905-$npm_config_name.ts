import { MigrationInterface, QueryRunner } from 'typeorm';

export class $npmConfigName1704919853905 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "kyc_steps"`);
        await queryRunner.query(`DROP TABLE "transaction_subtypes"`);
        await queryRunner.query(`DROP TABLE "account_types"`);
        await queryRunner.query(`DROP TABLE "bank_account_types"`);
    }

    public async down(): Promise<void> {}
}
