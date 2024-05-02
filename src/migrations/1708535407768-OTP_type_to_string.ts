import { MigrationInterface, QueryRunner } from 'typeorm';

export class OTPTypeToString1708535407768 implements MigrationInterface {
    name = 'OTPTypeToString1708535407768';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "otp_codes" DROP COLUMN "type"`);
        // await queryRunner.query(`DROP TYPE "public"."otp_codes_type_enum"`);
    }

    public async down(): Promise<void> {}
}
