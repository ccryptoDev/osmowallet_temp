import { MigrationInterface, QueryRunner } from 'typeorm';

export class FundingTransactionLimitTieridDeleted1711398021303 implements MigrationInterface {
    name = 'FundingTransactionLimitTieridDeleted1711398021303';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recurrent_buys" DROP CONSTRAINT "FK_5a483a562cf5a73fa65febf5d04"`);
        await queryRunner.query(`DROP INDEX "recurrent_buys"@"IDX_5a483a562cf5a73fa65febf5d0" CASCADE`);
        await queryRunner.query(`ALTER TABLE "recurrent_buys" RENAME COLUMN "period_id" TO "days"`);
        await queryRunner.query(
            `CREATE TABLE "tier_fundings" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "fee" decimal(15,3) NOT NULL DEFAULT (0), "min" decimal(15,2) NOT NULL DEFAULT (0), "max" decimal(15,2) NOT NULL DEFAULT (0), "daily_limit" decimal(15,2) NOT NULL DEFAULT (0), "monthly_limit" decimal(15,2) NOT NULL DEFAULT (0), "is_active" bool NOT NULL DEFAULT false, "funding_method_id" uuid, "tier_id" uuid, CONSTRAINT "PK_f09b6f6bc66c3a654b9ea142e4f" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_0870468bdc47b9e6b6d3b9b682" ON "tier_fundings" ("funding_method_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_b002cac2d94c09f8a073d7aa1e" ON "tier_fundings" ("tier_id") `);
        await queryRunner.query(
            `CREATE TABLE "funding_transaction_limits" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "daily_amassed_amount" decimal(15,2) NOT NULL DEFAULT (0), "monthly_amassed_amount" decimal(15,2) NOT NULL DEFAULT (0), "user_id" uuid, "fundingmethod_id" uuid, CONSTRAINT "PK_2fb01fecb92082f984c4d96c3c6" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_47c92aa6b7e5434da1520331d3" ON "funding_transaction_limits" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_dae6e1c923925d12e5da435630" ON "funding_transaction_limits" ("fundingmethod_id") `);
        await queryRunner.query(`ALTER TABLE "users" ADD "is_2fa_enabled" bool DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "autoconverts" DROP CONSTRAINT "FK_ccef4d7a6bf488bee32bacdd983"`);
        await queryRunner.query(`ALTER TABLE "automatic_buys" DROP CONSTRAINT "FK_491775ed0617d9341f74058ba33"`);
        await queryRunner.query(`ALTER TABLE "bank_accounts" DROP CONSTRAINT "FK_b4ef41f663b6b6560f5dd791c2e"`);
        await queryRunner.query(`ALTER TABLE "funding_method_coins" DROP CONSTRAINT "FK_edf5e4556d916327877a038244c"`);
        await queryRunner.query(`ALTER TABLE "withdrawal_method_coins" DROP CONSTRAINT "FK_2e7b545738e9aff15254e8c1c03"`);
        await queryRunner.query(`ALTER TABLE "historic_coin_rate" DROP CONSTRAINT "FK_73c28c1346a2c01804cdcde04dc"`);
        await queryRunner.query(`ALTER TABLE "osmo_bank_accounts" DROP CONSTRAINT "FK_792824eecab17343d2e3968c837"`);
        await queryRunner.query(`ALTER TABLE "recurrent_buys" DROP CONSTRAINT "FK_0adab556b47bb2cfea92b1748db"`);
        await queryRunner.query(`ALTER TABLE "wallets" DROP CONSTRAINT "FK_e39d170a0fc7c84a49ec9d60e58"`);
        await queryRunner.query(`ALTER TABLE "transaction_fees" DROP CONSTRAINT "FK_0fda5f8273c274e8479864de335"`);
        await queryRunner.query(`ALTER TABLE "transaction_groups" DROP CONSTRAINT "FK_ea469a5d09d7c87a68a2392a7b4"`);
        await queryRunner.query(`ALTER TABLE "country_coins" DROP CONSTRAINT "FK_c676fcca1a8ffef876f92d150cc"`);
        await queryRunner.query(`ALTER TABLE "coins" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "coins" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "country_withdraws" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "country_withdraws" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "withdrawal_method_coins" DROP CONSTRAINT "FK_e36e30f7402cd35b7c4d8a3722c"`);
        await queryRunner.query(`ALTER TABLE "country_withdraws" DROP CONSTRAINT "FK_7003eef70d124c49e4c1504cf64"`);
        await queryRunner.query(`ALTER TABLE "withdrawal_methods" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "withdrawal_methods" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "withdrawal_method_coins" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "withdrawal_method_coins" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "verifications" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "verifications" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "addresses" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "addresses" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_b23c65e50a758245a33ee35fda1"`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "user_roles" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "user_roles" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "nits" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "nits" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_0b171330be0cb621f8d73b87a9e"`);
        await queryRunner.query(`ALTER TABLE "wallet_history" DROP CONSTRAINT "FK_b4f1a70fbc037d3121266162429"`);
        await queryRunner.query(`ALTER TABLE "wallets" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "wallets" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "wallet_history" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "wallet_history" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "feature_platforms" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "feature_platforms" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "banks" DROP CONSTRAINT "banks_country_fk"`);
        await queryRunner.query(`ALTER TABLE "feature_countries" DROP CONSTRAINT "feature_countries_country_fk"`);
        await queryRunner.query(`ALTER TABLE "global_payment_countries" DROP CONSTRAINT "global_payment_countries_country_fk"`);
        await queryRunner.query(`ALTER TABLE "countries" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "countries" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "feature_countries" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "feature_countries" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "feature_platforms" DROP CONSTRAINT "FK_a0f2e916b47cce93c1e27c4ee6d"`);
        await queryRunner.query(`ALTER TABLE "feature_countries" DROP CONSTRAINT "FK_1f1559ab95ac6fe966a2f2f836c"`);
        await queryRunner.query(`ALTER TABLE "tier_features" DROP CONSTRAINT "FK_5b93ce41593d458012182958570"`);
        await queryRunner.query(`ALTER TABLE "user_transaction_limits" DROP CONSTRAINT "FK_fd63fc3f7cf26b51640cdd774a6"`);
        await queryRunner.query(`ALTER TABLE "features" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "features" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "user_transaction_limits" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "user_transaction_limits" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "blockchain_network_addresses" DROP CONSTRAINT "FK_bd2b255e407326f688cd1e7afcd"`);
        await queryRunner.query(`ALTER TABLE "blockchain_networks" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "blockchain_networks" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "blockchain_network_addresses" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "blockchain_network_addresses" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "historic_coin_rate" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "historic_coin_rate" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "historic_coin_rate" DROP CONSTRAINT "FK_3033e37cfd362c54e97e74e2b47"`);
        await queryRunner.query(`ALTER TABLE "transaction_groups" DROP CONSTRAINT "FK_a3f69d4a32d9556b48572f299ba"`);
        await queryRunner.query(`ALTER TABLE "historic_rate" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "historic_rate" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "transaction_groups" DROP CONSTRAINT "FK_2a6be0c2e3e531350516b33e974"`);
        await queryRunner.query(`ALTER TABLE "osmo_business_bpts" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "osmo_business_bpts" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "transaction_details" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "transaction_details" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "transaction_details" DROP CONSTRAINT "FK_6334b14562af3c8a2fb29dab8ac"`);
        await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "transaction_groups" DROP CONSTRAINT "FK_161a46f8e1c02cb97a613b086ca"`);
        await queryRunner.query(`ALTER TABLE "transaction_categories" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "transaction_categories" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "transaction_fees" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "transaction_fees" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "referrals" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "referrals" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_b7137c3934c8d9ca1865ce33a94"`);
        await queryRunner.query(`ALTER TABLE "transaction_fees" DROP CONSTRAINT "FK_1b7d5bcdcb2c85d7ac267787e33"`);
        await queryRunner.query(`ALTER TABLE "referrals" DROP CONSTRAINT "FK_9b3f9ac847774efa80663f344ce"`);
        await queryRunner.query(`ALTER TABLE "transaction_groups" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "transaction_groups" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "tier_features" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "tier_features" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "tier_features" DROP CONSTRAINT "FK_7e78005ee0987ad0b6a30e57922"`);
        await queryRunner.query(`ALTER TABLE "tier_users" DROP CONSTRAINT "FK_d526b480cfd0b1dc15c83e1d54e"`);
        await queryRunner.query(`ALTER TABLE "tiers" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "tiers" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "tier_users" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "tier_users" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "country_fundings" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "country_fundings" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "funding_method_coins" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "funding_method_coins" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "funding_method_coins" DROP CONSTRAINT "FK_506ef2b00c9e6d434424d403e56"`);
        await queryRunner.query(`ALTER TABLE "country_fundings" DROP CONSTRAINT "FK_c380a7e1cc69b62f0da220094ab"`);
        await queryRunner.query(`ALTER TABLE "funding_methods" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "funding_methods" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "partner_config" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "partner_config" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "push_tokens" DROP CONSTRAINT "FK_01bba5fceedafc4aeeb6aba31a9"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_adcd064347aaf352b0fa1a0c697"`);
        await queryRunner.query(`ALTER TABLE "auth_tokens" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "auth_tokens" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "sessions" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "sessions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "recurrent_buys" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "recurrent_buys" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "recurrent_buys" DROP COLUMN "days"`);
        await queryRunner.query(`ALTER TABLE "recurrent_buys" ADD "days" int2 NOT NULL`);
        await queryRunner.query(`ALTER TABLE "recent_contacts" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "recent_contacts" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "push_tokens" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "push_tokens" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP CONSTRAINT "FK_5acbe0118783083bb4a5e661eda"`);
        await queryRunner.query(`ALTER TABLE "periods" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "periods" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "preferences" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "preferences" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "partner_tokens" DROP CONSTRAINT "FK_1d6b12fdea2c6d5ed3fc27f724c"`);
        await queryRunner.query(`ALTER TABLE "apps" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "apps" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "partner_tokens" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "partner_tokens" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "otp_codes" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "otp_codes" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "bank_accounts" DROP CONSTRAINT "FK_482543ba26483726aaa00d39174"`);
        await queryRunner.query(`ALTER TABLE "osmo_bank_accounts" DROP CONSTRAINT "FK_fbe826ad018a8928d4fc8ed8aad"`);
        await queryRunner.query(`ALTER TABLE "banks" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "banks" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "osmo_bank_accounts" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "osmo_bank_accounts" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "kyc_verification_steps" DROP CONSTRAINT "FK_99729c51601bbcd7ffc24e0567e"`);
        await queryRunner.query(`ALTER TABLE "kyc_verifications" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "kyc_verifications" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "kyc_verification_steps" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "kyc_verification_steps" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "ibex_tokens" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "ibex_tokens" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "ibex_accounts" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "ibex_accounts" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "global_payments" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "global_payments" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "global_payment_countries" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "global_payment_countries" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "country_coins" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "country_coins" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "cashpak_users" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "cashpak_users" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "cashpak_tokens" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "cashpak_tokens" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "bank_accounts" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "bank_accounts" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "automatic_buys" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "automatic_buys" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "autoconverts" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "autoconverts" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "account_deletions" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "account_deletions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
        await queryRunner.query(
            `ALTER TABLE "country_withdraws" ADD CONSTRAINT "FK_7003eef70d124c49e4c1504cf64" FOREIGN KEY ("withdraw_id") REFERENCES "withdrawal_methods"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "withdrawal_method_coins" ADD CONSTRAINT "FK_e36e30f7402cd35b7c4d8a3722c" FOREIGN KEY ("withdrawal_method_id") REFERENCES "withdrawal_methods"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "withdrawal_method_coins" ADD CONSTRAINT "FK_2e7b545738e9aff15254e8c1c03" FOREIGN KEY ("coin_id") REFERENCES "coins"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "user_roles" ADD CONSTRAINT "FK_b23c65e50a758245a33ee35fda1" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "wallets" ADD CONSTRAINT "FK_e39d170a0fc7c84a49ec9d60e58" FOREIGN KEY ("coin_id") REFERENCES "coins"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "wallet_history" ADD CONSTRAINT "FK_b4f1a70fbc037d3121266162429" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "feature_platforms" ADD CONSTRAINT "FK_a0f2e916b47cce93c1e27c4ee6d" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "feature_countries" ADD CONSTRAINT "FK_1f1559ab95ac6fe966a2f2f836c" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "feature_countries" ADD CONSTRAINT "feature_countries_country_fk" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "user_transaction_limits" ADD CONSTRAINT "FK_fd63fc3f7cf26b51640cdd774a6" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "blockchain_network_addresses" ADD CONSTRAINT "FK_bd2b255e407326f688cd1e7afcd" FOREIGN KEY ("networkId") REFERENCES "blockchain_networks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "historic_coin_rate" ADD CONSTRAINT "FK_3033e37cfd362c54e97e74e2b47" FOREIGN KEY ("historic_rate_id") REFERENCES "historic_rate"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "historic_coin_rate" ADD CONSTRAINT "FK_73c28c1346a2c01804cdcde04dc" FOREIGN KEY ("coin_id") REFERENCES "coins"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "transaction_details" ADD CONSTRAINT "FK_6334b14562af3c8a2fb29dab8ac" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "transactions" ADD CONSTRAINT "FK_0b171330be0cb621f8d73b87a9e" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "transactions" ADD CONSTRAINT "FK_b7137c3934c8d9ca1865ce33a94" FOREIGN KEY ("transaction_group_id") REFERENCES "transaction_groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "transaction_fees" ADD CONSTRAINT "FK_1b7d5bcdcb2c85d7ac267787e33" FOREIGN KEY ("transaction_group_id") REFERENCES "transaction_groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "transaction_fees" ADD CONSTRAINT "FK_0fda5f8273c274e8479864de335" FOREIGN KEY ("coin_id") REFERENCES "coins"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" ADD CONSTRAINT "FK_9b3f9ac847774efa80663f344ce" FOREIGN KEY ("transaction_group_id") REFERENCES "transaction_groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "transaction_groups" ADD CONSTRAINT "FK_161a46f8e1c02cb97a613b086ca" FOREIGN KEY ("transaction_category_id") REFERENCES "transaction_categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "transaction_groups" ADD CONSTRAINT "FK_ea469a5d09d7c87a68a2392a7b4" FOREIGN KEY ("transaction_coin_id") REFERENCES "coins"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "transaction_groups" ADD CONSTRAINT "FK_a3f69d4a32d9556b48572f299ba" FOREIGN KEY ("historicRateId") REFERENCES "historic_rate"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "transaction_groups" ADD CONSTRAINT "FK_2a6be0c2e3e531350516b33e974" FOREIGN KEY ("osmo_bussiness_id") REFERENCES "osmo_business_bpts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "tier_features" ADD CONSTRAINT "FK_5b93ce41593d458012182958570" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "tier_features" ADD CONSTRAINT "FK_7e78005ee0987ad0b6a30e57922" FOREIGN KEY ("tier_id") REFERENCES "tiers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "tier_users" ADD CONSTRAINT "FK_d526b480cfd0b1dc15c83e1d54e" FOREIGN KEY ("tier_id") REFERENCES "tiers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "country_fundings" ADD CONSTRAINT "FK_c380a7e1cc69b62f0da220094ab" FOREIGN KEY ("funding_id") REFERENCES "funding_methods"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "funding_method_coins" ADD CONSTRAINT "FK_506ef2b00c9e6d434424d403e56" FOREIGN KEY ("funding_method_id") REFERENCES "funding_methods"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "funding_method_coins" ADD CONSTRAINT "FK_edf5e4556d916327877a038244c" FOREIGN KEY ("coin_id") REFERENCES "coins"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "tier_fundings" ADD CONSTRAINT "FK_0870468bdc47b9e6b6d3b9b6828" FOREIGN KEY ("funding_method_id") REFERENCES "funding_methods"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "tier_fundings" ADD CONSTRAINT "FK_b002cac2d94c09f8a073d7aa1eb" FOREIGN KEY ("tier_id") REFERENCES "tiers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "sessions" ADD CONSTRAINT "FK_adcd064347aaf352b0fa1a0c697" FOREIGN KEY ("auth_token_id") REFERENCES "auth_tokens"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "recurrent_buys" ADD CONSTRAINT "FK_0adab556b47bb2cfea92b1748db" FOREIGN KEY ("coin_id") REFERENCES "coins"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "push_tokens" ADD CONSTRAINT "FK_01bba5fceedafc4aeeb6aba31a9" FOREIGN KEY ("auth_token_id") REFERENCES "auth_tokens"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "preferences" ADD CONSTRAINT "FK_5acbe0118783083bb4a5e661eda" FOREIGN KEY ("ask_pin_id") REFERENCES "periods"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "partner_tokens" ADD CONSTRAINT "FK_1d6b12fdea2c6d5ed3fc27f724c" FOREIGN KEY ("app_id") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "banks" ADD CONSTRAINT "banks_country_fk" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "osmo_bank_accounts" ADD CONSTRAINT "FK_792824eecab17343d2e3968c837" FOREIGN KEY ("coin_id") REFERENCES "coins"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "osmo_bank_accounts" ADD CONSTRAINT "FK_fbe826ad018a8928d4fc8ed8aad" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "kyc_verification_steps" ADD CONSTRAINT "FK_99729c51601bbcd7ffc24e0567e" FOREIGN KEY ("kyc_verification_id") REFERENCES "kyc_verifications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "global_payment_countries" ADD CONSTRAINT "global_payment_countries_country_fk" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "funding_transaction_limits" ADD CONSTRAINT "FK_47c92aa6b7e5434da1520331d3a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "funding_transaction_limits" ADD CONSTRAINT "FK_dae6e1c923925d12e5da4356306" FOREIGN KEY ("fundingmethod_id") REFERENCES "funding_methods"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "country_coins" ADD CONSTRAINT "FK_c676fcca1a8ffef876f92d150cc" FOREIGN KEY ("coin_id") REFERENCES "coins"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "bank_accounts" ADD CONSTRAINT "FK_b4ef41f663b6b6560f5dd791c2e" FOREIGN KEY ("coin_id") REFERENCES "coins"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "bank_accounts" ADD CONSTRAINT "FK_482543ba26483726aaa00d39174" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "automatic_buys" ADD CONSTRAINT "FK_491775ed0617d9341f74058ba33" FOREIGN KEY ("coin_id") REFERENCES "coins"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "autoconverts" ADD CONSTRAINT "FK_ccef4d7a6bf488bee32bacdd983" FOREIGN KEY ("coin_id") REFERENCES "coins"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "autoconverts" DROP CONSTRAINT "FK_ccef4d7a6bf488bee32bacdd983"`);
        await queryRunner.query(`ALTER TABLE "automatic_buys" DROP CONSTRAINT "FK_491775ed0617d9341f74058ba33"`);
        await queryRunner.query(`ALTER TABLE "bank_accounts" DROP CONSTRAINT "FK_482543ba26483726aaa00d39174"`);
        await queryRunner.query(`ALTER TABLE "bank_accounts" DROP CONSTRAINT "FK_b4ef41f663b6b6560f5dd791c2e"`);
        await queryRunner.query(`ALTER TABLE "country_coins" DROP CONSTRAINT "FK_c676fcca1a8ffef876f92d150cc"`);
        await queryRunner.query(`ALTER TABLE "funding_transaction_limits" DROP CONSTRAINT "FK_dae6e1c923925d12e5da4356306"`);
        await queryRunner.query(`ALTER TABLE "funding_transaction_limits" DROP CONSTRAINT "FK_47c92aa6b7e5434da1520331d3a"`);
        await queryRunner.query(`ALTER TABLE "global_payment_countries" DROP CONSTRAINT "global_payment_countries_country_fk"`);
        await queryRunner.query(`ALTER TABLE "kyc_verification_steps" DROP CONSTRAINT "FK_99729c51601bbcd7ffc24e0567e"`);
        await queryRunner.query(`ALTER TABLE "osmo_bank_accounts" DROP CONSTRAINT "FK_fbe826ad018a8928d4fc8ed8aad"`);
        await queryRunner.query(`ALTER TABLE "osmo_bank_accounts" DROP CONSTRAINT "FK_792824eecab17343d2e3968c837"`);
        await queryRunner.query(`ALTER TABLE "banks" DROP CONSTRAINT "banks_country_fk"`);
        await queryRunner.query(`ALTER TABLE "partner_tokens" DROP CONSTRAINT "FK_1d6b12fdea2c6d5ed3fc27f724c"`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP CONSTRAINT "FK_5acbe0118783083bb4a5e661eda"`);
        await queryRunner.query(`ALTER TABLE "push_tokens" DROP CONSTRAINT "FK_01bba5fceedafc4aeeb6aba31a9"`);
        await queryRunner.query(`ALTER TABLE "recurrent_buys" DROP CONSTRAINT "FK_0adab556b47bb2cfea92b1748db"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_adcd064347aaf352b0fa1a0c697"`);
        await queryRunner.query(`ALTER TABLE "tier_fundings" DROP CONSTRAINT "FK_b002cac2d94c09f8a073d7aa1eb"`);
        await queryRunner.query(`ALTER TABLE "tier_fundings" DROP CONSTRAINT "FK_0870468bdc47b9e6b6d3b9b6828"`);
        await queryRunner.query(`ALTER TABLE "funding_method_coins" DROP CONSTRAINT "FK_edf5e4556d916327877a038244c"`);
        await queryRunner.query(`ALTER TABLE "funding_method_coins" DROP CONSTRAINT "FK_506ef2b00c9e6d434424d403e56"`);
        await queryRunner.query(`ALTER TABLE "country_fundings" DROP CONSTRAINT "FK_c380a7e1cc69b62f0da220094ab"`);
        await queryRunner.query(`ALTER TABLE "tier_users" DROP CONSTRAINT "FK_d526b480cfd0b1dc15c83e1d54e"`);
        await queryRunner.query(`ALTER TABLE "tier_features" DROP CONSTRAINT "FK_7e78005ee0987ad0b6a30e57922"`);
        await queryRunner.query(`ALTER TABLE "tier_features" DROP CONSTRAINT "FK_5b93ce41593d458012182958570"`);
        await queryRunner.query(`ALTER TABLE "transaction_groups" DROP CONSTRAINT "FK_2a6be0c2e3e531350516b33e974"`);
        await queryRunner.query(`ALTER TABLE "transaction_groups" DROP CONSTRAINT "FK_a3f69d4a32d9556b48572f299ba"`);
        await queryRunner.query(`ALTER TABLE "transaction_groups" DROP CONSTRAINT "FK_ea469a5d09d7c87a68a2392a7b4"`);
        await queryRunner.query(`ALTER TABLE "transaction_groups" DROP CONSTRAINT "FK_161a46f8e1c02cb97a613b086ca"`);
        await queryRunner.query(`ALTER TABLE "referrals" DROP CONSTRAINT "FK_9b3f9ac847774efa80663f344ce"`);
        await queryRunner.query(`ALTER TABLE "transaction_fees" DROP CONSTRAINT "FK_0fda5f8273c274e8479864de335"`);
        await queryRunner.query(`ALTER TABLE "transaction_fees" DROP CONSTRAINT "FK_1b7d5bcdcb2c85d7ac267787e33"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_b7137c3934c8d9ca1865ce33a94"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_0b171330be0cb621f8d73b87a9e"`);
        await queryRunner.query(`ALTER TABLE "transaction_details" DROP CONSTRAINT "FK_6334b14562af3c8a2fb29dab8ac"`);
        await queryRunner.query(`ALTER TABLE "historic_coin_rate" DROP CONSTRAINT "FK_73c28c1346a2c01804cdcde04dc"`);
        await queryRunner.query(`ALTER TABLE "historic_coin_rate" DROP CONSTRAINT "FK_3033e37cfd362c54e97e74e2b47"`);
        await queryRunner.query(`ALTER TABLE "blockchain_network_addresses" DROP CONSTRAINT "FK_bd2b255e407326f688cd1e7afcd"`);
        await queryRunner.query(`ALTER TABLE "user_transaction_limits" DROP CONSTRAINT "FK_fd63fc3f7cf26b51640cdd774a6"`);
        await queryRunner.query(`ALTER TABLE "feature_countries" DROP CONSTRAINT "feature_countries_country_fk"`);
        await queryRunner.query(`ALTER TABLE "feature_countries" DROP CONSTRAINT "FK_1f1559ab95ac6fe966a2f2f836c"`);
        await queryRunner.query(`ALTER TABLE "feature_platforms" DROP CONSTRAINT "FK_a0f2e916b47cce93c1e27c4ee6d"`);
        await queryRunner.query(`ALTER TABLE "wallet_history" DROP CONSTRAINT "FK_b4f1a70fbc037d3121266162429"`);
        await queryRunner.query(`ALTER TABLE "wallets" DROP CONSTRAINT "FK_e39d170a0fc7c84a49ec9d60e58"`);
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_b23c65e50a758245a33ee35fda1"`);
        await queryRunner.query(`ALTER TABLE "withdrawal_method_coins" DROP CONSTRAINT "FK_2e7b545738e9aff15254e8c1c03"`);
        await queryRunner.query(`ALTER TABLE "withdrawal_method_coins" DROP CONSTRAINT "FK_e36e30f7402cd35b7c4d8a3722c"`);
        await queryRunner.query(`ALTER TABLE "country_withdraws" DROP CONSTRAINT "FK_7003eef70d124c49e4c1504cf64"`);
        await queryRunner.query(`ALTER TABLE "account_deletions" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "account_deletions" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(`ALTER TABLE "autoconverts" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "autoconverts" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(`ALTER TABLE "automatic_buys" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "automatic_buys" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(`ALTER TABLE "bank_accounts" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "bank_accounts" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(`ALTER TABLE "cashpak_tokens" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "cashpak_tokens" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(`ALTER TABLE "cashpak_users" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "cashpak_users" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(`ALTER TABLE "country_coins" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "country_coins" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(`ALTER TABLE "global_payment_countries" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "global_payment_countries" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(`ALTER TABLE "global_payments" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "global_payments" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(`ALTER TABLE "ibex_accounts" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "ibex_accounts" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(`ALTER TABLE "ibex_tokens" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "ibex_tokens" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(`ALTER TABLE "kyc_verification_steps" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "kyc_verification_steps" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(`ALTER TABLE "kyc_verifications" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "kyc_verifications" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(
            `ALTER TABLE "kyc_verification_steps" ADD CONSTRAINT "FK_99729c51601bbcd7ffc24e0567e" FOREIGN KEY ("kyc_verification_id") REFERENCES "kyc_verifications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(`ALTER TABLE "osmo_bank_accounts" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "osmo_bank_accounts" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(`ALTER TABLE "banks" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "banks" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(
            `ALTER TABLE "osmo_bank_accounts" ADD CONSTRAINT "FK_fbe826ad018a8928d4fc8ed8aad" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "bank_accounts" ADD CONSTRAINT "FK_482543ba26483726aaa00d39174" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(`ALTER TABLE "otp_codes" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "otp_codes" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(`ALTER TABLE "partner_tokens" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "partner_tokens" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(`ALTER TABLE "apps" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "apps" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(
            `ALTER TABLE "partner_tokens" ADD CONSTRAINT "FK_1d6b12fdea2c6d5ed3fc27f724c" FOREIGN KEY ("app_id") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(`ALTER TABLE "preferences" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "preferences" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(`ALTER TABLE "periods" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "periods" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(
            `ALTER TABLE "preferences" ADD CONSTRAINT "FK_5acbe0118783083bb4a5e661eda" FOREIGN KEY ("ask_pin_id") REFERENCES "periods"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(`ALTER TABLE "push_tokens" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "push_tokens" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(`ALTER TABLE "recent_contacts" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "recent_contacts" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(`ALTER TABLE "recurrent_buys" DROP COLUMN "days"`);
        await queryRunner.query(`ALTER TABLE "recurrent_buys" ADD "days" uuid`);
        await queryRunner.query(`ALTER TABLE "recurrent_buys" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "recurrent_buys" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(`ALTER TABLE "sessions" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "sessions" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(`ALTER TABLE "auth_tokens" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "auth_tokens" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(
            `ALTER TABLE "sessions" ADD CONSTRAINT "FK_adcd064347aaf352b0fa1a0c697" FOREIGN KEY ("auth_token_id") REFERENCES "auth_tokens"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "push_tokens" ADD CONSTRAINT "FK_01bba5fceedafc4aeeb6aba31a9" FOREIGN KEY ("auth_token_id") REFERENCES "auth_tokens"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "settings" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(`ALTER TABLE "partner_config" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "partner_config" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(`ALTER TABLE "funding_methods" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "funding_methods" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(
            `ALTER TABLE "country_fundings" ADD CONSTRAINT "FK_c380a7e1cc69b62f0da220094ab" FOREIGN KEY ("funding_id") REFERENCES "funding_methods"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "funding_method_coins" ADD CONSTRAINT "FK_506ef2b00c9e6d434424d403e56" FOREIGN KEY ("funding_method_id") REFERENCES "funding_methods"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(`ALTER TABLE "funding_method_coins" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "funding_method_coins" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(`ALTER TABLE "country_fundings" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "country_fundings" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(`ALTER TABLE "tier_users" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "tier_users" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(`ALTER TABLE "tiers" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "tiers" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(
            `ALTER TABLE "tier_users" ADD CONSTRAINT "FK_d526b480cfd0b1dc15c83e1d54e" FOREIGN KEY ("tier_id") REFERENCES "tiers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "tier_features" ADD CONSTRAINT "FK_7e78005ee0987ad0b6a30e57922" FOREIGN KEY ("tier_id") REFERENCES "tiers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(`ALTER TABLE "tier_features" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "tier_features" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(`ALTER TABLE "transaction_groups" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "transaction_groups" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(
            `ALTER TABLE "referrals" ADD CONSTRAINT "FK_9b3f9ac847774efa80663f344ce" FOREIGN KEY ("transaction_group_id") REFERENCES "transaction_groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "transaction_fees" ADD CONSTRAINT "FK_1b7d5bcdcb2c85d7ac267787e33" FOREIGN KEY ("transaction_group_id") REFERENCES "transaction_groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "transactions" ADD CONSTRAINT "FK_b7137c3934c8d9ca1865ce33a94" FOREIGN KEY ("transaction_group_id") REFERENCES "transaction_groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(`ALTER TABLE "referrals" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "referrals" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(`ALTER TABLE "transaction_fees" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "transaction_fees" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(`ALTER TABLE "transaction_categories" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "transaction_categories" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(
            `ALTER TABLE "transaction_groups" ADD CONSTRAINT "FK_161a46f8e1c02cb97a613b086ca" FOREIGN KEY ("transaction_category_id") REFERENCES "transaction_categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
        );
        await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(
            `ALTER TABLE "transaction_details" ADD CONSTRAINT "FK_6334b14562af3c8a2fb29dab8ac" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(`ALTER TABLE "transaction_details" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "transaction_details" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(`ALTER TABLE "osmo_business_bpts" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "osmo_business_bpts" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(
            `ALTER TABLE "transaction_groups" ADD CONSTRAINT "FK_2a6be0c2e3e531350516b33e974" FOREIGN KEY ("osmo_bussiness_id") REFERENCES "osmo_business_bpts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(`ALTER TABLE "historic_rate" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "historic_rate" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(
            `ALTER TABLE "transaction_groups" ADD CONSTRAINT "FK_a3f69d4a32d9556b48572f299ba" FOREIGN KEY ("historicRateId") REFERENCES "historic_rate"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "historic_coin_rate" ADD CONSTRAINT "FK_3033e37cfd362c54e97e74e2b47" FOREIGN KEY ("historic_rate_id") REFERENCES "historic_rate"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(`ALTER TABLE "historic_coin_rate" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "historic_coin_rate" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(`ALTER TABLE "blockchain_network_addresses" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "blockchain_network_addresses" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(`ALTER TABLE "blockchain_networks" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "blockchain_networks" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(
            `ALTER TABLE "blockchain_network_addresses" ADD CONSTRAINT "FK_bd2b255e407326f688cd1e7afcd" FOREIGN KEY ("networkId") REFERENCES "blockchain_networks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(`ALTER TABLE "user_transaction_limits" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "user_transaction_limits" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(`ALTER TABLE "features" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "features" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(
            `ALTER TABLE "user_transaction_limits" ADD CONSTRAINT "FK_fd63fc3f7cf26b51640cdd774a6" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "tier_features" ADD CONSTRAINT "FK_5b93ce41593d458012182958570" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "feature_countries" ADD CONSTRAINT "FK_1f1559ab95ac6fe966a2f2f836c" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "feature_platforms" ADD CONSTRAINT "FK_a0f2e916b47cce93c1e27c4ee6d" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(`ALTER TABLE "feature_countries" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "feature_countries" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(`ALTER TABLE "countries" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "countries" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(
            `ALTER TABLE "global_payment_countries" ADD CONSTRAINT "global_payment_countries_country_fk" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "feature_countries" ADD CONSTRAINT "feature_countries_country_fk" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "banks" ADD CONSTRAINT "banks_country_fk" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(`ALTER TABLE "feature_platforms" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "feature_platforms" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(`ALTER TABLE "wallet_history" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "wallet_history" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(`ALTER TABLE "wallets" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "wallets" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(
            `ALTER TABLE "wallet_history" ADD CONSTRAINT "FK_b4f1a70fbc037d3121266162429" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "transactions" ADD CONSTRAINT "FK_0b171330be0cb621f8d73b87a9e" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(`ALTER TABLE "nits" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "nits" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(`ALTER TABLE "user_roles" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "user_roles" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(
            `ALTER TABLE "user_roles" ADD CONSTRAINT "FK_b23c65e50a758245a33ee35fda1" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(`ALTER TABLE "addresses" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "addresses" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(`ALTER TABLE "verifications" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "verifications" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(`ALTER TABLE "withdrawal_method_coins" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "withdrawal_method_coins" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(`ALTER TABLE "withdrawal_methods" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "withdrawal_methods" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(
            `ALTER TABLE "country_withdraws" ADD CONSTRAINT "FK_7003eef70d124c49e4c1504cf64" FOREIGN KEY ("withdraw_id") REFERENCES "withdrawal_methods"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "withdrawal_method_coins" ADD CONSTRAINT "FK_e36e30f7402cd35b7c4d8a3722c" FOREIGN KEY ("withdrawal_method_id") REFERENCES "withdrawal_methods"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(`ALTER TABLE "country_withdraws" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "country_withdraws" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(`ALTER TABLE "coins" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "coins" ALTER COLUMN "id" SET DEFAULT unique_rowid()`);
        await queryRunner.query(
            `ALTER TABLE "country_coins" ADD CONSTRAINT "FK_c676fcca1a8ffef876f92d150cc" FOREIGN KEY ("coin_id") REFERENCES "coins"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "transaction_groups" ADD CONSTRAINT "FK_ea469a5d09d7c87a68a2392a7b4" FOREIGN KEY ("transaction_coin_id") REFERENCES "coins"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "transaction_fees" ADD CONSTRAINT "FK_0fda5f8273c274e8479864de335" FOREIGN KEY ("coin_id") REFERENCES "coins"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "wallets" ADD CONSTRAINT "FK_e39d170a0fc7c84a49ec9d60e58" FOREIGN KEY ("coin_id") REFERENCES "coins"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "recurrent_buys" ADD CONSTRAINT "FK_0adab556b47bb2cfea92b1748db" FOREIGN KEY ("coin_id") REFERENCES "coins"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "osmo_bank_accounts" ADD CONSTRAINT "FK_792824eecab17343d2e3968c837" FOREIGN KEY ("coin_id") REFERENCES "coins"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "historic_coin_rate" ADD CONSTRAINT "FK_73c28c1346a2c01804cdcde04dc" FOREIGN KEY ("coin_id") REFERENCES "coins"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "withdrawal_method_coins" ADD CONSTRAINT "FK_2e7b545738e9aff15254e8c1c03" FOREIGN KEY ("coin_id") REFERENCES "coins"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "funding_method_coins" ADD CONSTRAINT "FK_edf5e4556d916327877a038244c" FOREIGN KEY ("coin_id") REFERENCES "coins"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "bank_accounts" ADD CONSTRAINT "FK_b4ef41f663b6b6560f5dd791c2e" FOREIGN KEY ("coin_id") REFERENCES "coins"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "automatic_buys" ADD CONSTRAINT "FK_491775ed0617d9341f74058ba33" FOREIGN KEY ("coin_id") REFERENCES "coins"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "autoconverts" ADD CONSTRAINT "FK_ccef4d7a6bf488bee32bacdd983" FOREIGN KEY ("coin_id") REFERENCES "coins"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_2fa_enabled"`);
        await queryRunner.query(`DROP INDEX "funding_transaction_limits"@"IDX_dae6e1c923925d12e5da435630" CASCADE`);
        await queryRunner.query(`DROP INDEX "funding_transaction_limits"@"IDX_47c92aa6b7e5434da1520331d3" CASCADE`);
        await queryRunner.query(`DROP TABLE "funding_transaction_limits"`);
        await queryRunner.query(`DROP INDEX "tier_fundings"@"IDX_b002cac2d94c09f8a073d7aa1e" CASCADE`);
        await queryRunner.query(`DROP INDEX "tier_fundings"@"IDX_0870468bdc47b9e6b6d3b9b682" CASCADE`);
        await queryRunner.query(`DROP TABLE "tier_fundings"`);
        await queryRunner.query(`ALTER TABLE "recurrent_buys" RENAME COLUMN "days" TO "period_id"`);
        await queryRunner.query(`CREATE INDEX "IDX_5a483a562cf5a73fa65febf5d0" ON "recurrent_buys" ("period_id") `);
        await queryRunner.query(
            `ALTER TABLE "recurrent_buys" ADD CONSTRAINT "FK_5a483a562cf5a73fa65febf5d04" FOREIGN KEY ("period_id") REFERENCES "periods"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
    }
}
