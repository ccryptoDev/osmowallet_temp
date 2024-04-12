import { MigrationInterface, QueryRunner } from "typeorm";

export class DocumentNumberKyc1706902604884 implements MigrationInterface {
    name = 'DocumentNumberKyc1706902604884'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "kyc_verifications" ADD "document_number" varchar`);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        
        await queryRunner.query(`ALTER TABLE "kyc_verifications" DROP COLUMN "document_number"`);
    }

}
