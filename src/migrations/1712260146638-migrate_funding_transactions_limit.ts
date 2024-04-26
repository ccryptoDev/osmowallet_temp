import { MigrationInterface, QueryRunner } from "typeorm";

export class MigrateFundingTransactionsLimit1712260146638 implements MigrationInterface {
    name = 'MigrateFundingTransactionsLimit1712260146638'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`INSERT INTO funding_transaction_limits (user_id, fundingmethod_id) SELECT u.id, fm.id FROM users AS u CROSS JOIN funding_methods AS fm`);
        await queryRunner.query(`INSERT INTO tier_fundings (funding_method_id, tier_id, fee, min, max, daily_limit, monthly_limit, is_active) SELECT fm.id, t.id, fm.fee, fm.min, fm.max, tf.daily_limit, tf.monthly_limit, true FROM funding_methods AS fm CROSS JOIN tiers AS t JOIN tier_features AS tf ON t.id = tf.tier_id;`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
