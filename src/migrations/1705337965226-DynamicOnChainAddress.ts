import { MigrationInterface, QueryRunner } from 'typeorm';

export class DynamicOnChainAddress1705337965226 implements MigrationInterface {
    name = 'DynamicOnChainAddress1705337965226';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "preferences" RENAME COLUMN "promotional_notification" TO "dynamic_onchain_address"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "preferences" RENAME COLUMN "dynamic_onchain_address" TO "promotional_notification"`);
    }
}
