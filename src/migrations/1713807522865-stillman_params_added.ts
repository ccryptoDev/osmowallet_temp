import { MigrationInterface, QueryRunner } from 'typeorm';

export class StillmanParamsAdded1713807522865 implements MigrationInterface {
    name = 'StillmanParamsAdded1713807522865';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "stillman_params" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "buffer" decimal(15,2) NOT NULL DEFAULT (0), "balancePercentage" decimal(15,2) NOT NULL DEFAULT (0), "stillmanAddress" varchar NOT NULL DEFAULT 'bc1qdqdkujd64m4v48pr6wwhdp52xd9aq4xm39rwrn', CONSTRAINT "PK_aeab7afe5ccb4bf6f36019db5ca" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `INSERT INTO "stillman_params" ("buffer", "balancePercentage", "stillmanAddress") VALUES (2500.00, 20.00, 'bc1qdqdkujd64m4v48pr6wwhdp52xd9aq4xm39rwrn')`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "stillman_params"`);
    }
}
