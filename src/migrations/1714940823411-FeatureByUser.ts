import { MigrationInterface, QueryRunner } from "typeorm";

export class FeatureByUser1714940823411 implements MigrationInterface {
    name = 'FeatureByUser1714940823411'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_features" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "is_active" bool NOT NULL DEFAULT true, "user_id" uuid, "feature_id" uuid, CONSTRAINT "PK_167060a0a5cbfe009f74a4b1fb6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_93ba05009b2885ad70d531958d" ON "user_features" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_425a9588c92b262a12d58bde45" ON "user_features" ("feature_id") `);
        await queryRunner.query(`ALTER TABLE "user_features" ADD CONSTRAINT "FK_93ba05009b2885ad70d531958d3" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_features" ADD CONSTRAINT "FK_425a9588c92b262a12d58bde45b" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`
            INSERT INTO user_features (user_id, feature_id, is_active)
            SELECT u.id, f.id, true
            FROM users u
            CROSS JOIN features f;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_features" DROP CONSTRAINT "FK_425a9588c92b262a12d58bde45b"`);
        await queryRunner.query(`ALTER TABLE "user_features" DROP CONSTRAINT "FK_93ba05009b2885ad70d531958d3"`);
        await queryRunner.query(`DROP INDEX "user_features"@"IDX_425a9588c92b262a12d58bde45" CASCADE`);
        await queryRunner.query(`DROP INDEX "user_features"@"IDX_93ba05009b2885ad70d531958d" CASCADE`);
        await queryRunner.query(`DROP TABLE "user_features"`);
       
    }

}
