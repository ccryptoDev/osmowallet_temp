import { MigrationInterface, QueryRunner } from 'typeorm';

export class LogoBanks1703878122004 implements MigrationInterface {
    name = 'LogoBanks1703878122004';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "accounts" DROP CONSTRAINT "FK_f4ab929cd365ac8a66fd8e42022"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_2c2d6f124721b0b8e5aec39a8cb"`);
        await queryRunner.query(`DROP INDEX "accounts"@"IDX_f4ab929cd365ac8a66fd8e4202" CASCADE`);
        await queryRunner.query(`DROP INDEX "transactions"@"IDX_2c2d6f124721b0b8e5aec39a8c" CASCADE`);
        await queryRunner.query(`ALTER TABLE "accounts" RENAME COLUMN "account_type_id" TO "account_type"`);
        await queryRunner.query(`ALTER TABLE "transactions" RENAME COLUMN "transaction_subtype_id" TO "subtype"`);
        await queryRunner.query(`ALTER TABLE "banks" DROP COLUMN "image"`);
        await queryRunner.query(`ALTER TABLE "osmo_business_bpts" DROP COLUMN "logo_path"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "osmo_business_bpts" ADD "logo_path" varchar(100)`);
        await queryRunner.query(
            `ALTER TABLE "banks" ADD "image" varchar NOT NULL DEFAULT 'https://firebasestorage.googleapis.com/v0/b/osmowallet.appspot.com/o/banks%2Flogo-default.png?alt=media&token=c1d3be47-e6b3-42b5-b2be-130c438b9e13'`,
        );
        await queryRunner.query(`ALTER TABLE "transactions" RENAME COLUMN "subtype" TO "transaction_subtype_id"`);
        await queryRunner.query(`ALTER TABLE "accounts" RENAME COLUMN "account_type" TO "account_type_id"`);
        await queryRunner.query(`CREATE INDEX "IDX_2c2d6f124721b0b8e5aec39a8c" ON "transactions" ("transaction_subtype_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_f4ab929cd365ac8a66fd8e4202" ON "accounts" ("account_type_id") `);
        await queryRunner.query(
            `ALTER TABLE "transactions" ADD CONSTRAINT "FK_2c2d6f124721b0b8e5aec39a8cb" FOREIGN KEY ("transaction_subtype_id") REFERENCES "transaction_subtypes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "accounts" ADD CONSTRAINT "FK_f4ab929cd365ac8a66fd8e42022" FOREIGN KEY ("account_type_id") REFERENCES "account_types"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
    }
}
