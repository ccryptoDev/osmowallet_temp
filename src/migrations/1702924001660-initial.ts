import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1702924001660 implements MigrationInterface {
    name = 'Initial1702924001660';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "account_types" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" varchar NOT NULL, CONSTRAINT "PK_1944ce0e8e4a9f29fa1d4fbe4ce" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "apps" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "client_id" varchar(500) NOT NULL, "client_secret" varchar(500) NOT NULL, "webhook_url" varchar(500), "name" varchar NOT NULL, CONSTRAINT "UQ_427a4f04c1469d1d4515fbb2c13" UNIQUE ("client_id"), CONSTRAINT "PK_c5121fda0f8268f1f7f84134e19" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "verifications" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "email" bool NOT NULL DEFAULT false, "mobile" bool NOT NULL DEFAULT false, "kyc" bool NOT NULL DEFAULT false, "user_id" uuid, CONSTRAINT "REL_e9a134af366776c65116891661" UNIQUE ("user_id"), CONSTRAINT "PK_2127ad1b143cf012280390b01d1" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_e9a134af366776c65116891661" ON "verifications" ("user_id") `);
        await queryRunner.query(
            `CREATE TABLE "addresses" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "ln" varchar NOT NULL, "onchain" varchar NOT NULL, "lnurl_payer" varchar NOT NULL, "user_id" uuid, CONSTRAINT "REL_16aac8a9f6f9c1dd6bcb75ec02" UNIQUE ("user_id"), CONSTRAINT "PK_745d8f43d3af10ab8247465e450" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_16aac8a9f6f9c1dd6bcb75ec02" ON "addresses" ("user_id") `);
        await queryRunner.query(
            `CREATE TABLE "roles" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" varchar NOT NULL, CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "user_roles" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "user_id" uuid, "role_id" uuid, CONSTRAINT "REL_87b8888186ca9769c960e92687" UNIQUE ("user_id"), CONSTRAINT "PK_8acd5cf26ebd158416f477de799" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_87b8888186ca9769c960e92687" ON "user_roles" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_b23c65e50a758245a33ee35fda" ON "user_roles" ("role_id") `);
        await queryRunner.query(
            `CREATE TABLE "nits" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "nit" varchar NOT NULL, "created_at" timestamp NOT NULL DEFAULT now(), "updated_at" timestamp NOT NULL DEFAULT now(), "user_id" uuid, CONSTRAINT "REL_76da22567cf596e5a99e3dd50d" UNIQUE ("user_id"), CONSTRAINT "PK_273999b1daf5eb92bad9008de2f" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_76da22567cf596e5a99e3dd50d" ON "nits" ("user_id") `);
        await queryRunner.query(
            `CREATE TABLE "users" ("id" UUID DEFAULT gen_random_uuid() NOT NULL, "email" varchar, "password" varchar, "pin" varchar, "username" varchar, "first_name" varchar, "last_name" varchar, "mobile" varchar, "nationality" varchar, "residence" varchar NOT NULL, "username_changes" int8 NOT NULL DEFAULT (0), "last_session" timestamp, "is_active" bool NOT NULL DEFAULT true, "profile_picture" varchar(1000), "profile_picture_path" varchar, "profile_picture_expiry" timestamp, "hash" varchar, "created_at" timestamp NOT NULL DEFAULT now(), "updated_at" timestamp NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "UQ_d376a9f93bba651f32a2c03a7d3" UNIQUE ("mobile"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "accounts" ("id" UUID DEFAULT gen_random_uuid() NOT NULL, "alias" varchar, "user_id" uuid, "account_type_id" uuid, CONSTRAINT "REL_3000dad1da61b29953f0747632" UNIQUE ("user_id"), CONSTRAINT "PK_5a7a02c20412299d198e097a8fe" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_3000dad1da61b29953f0747632" ON "accounts" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_f4ab929cd365ac8a66fd8e4202" ON "accounts" ("account_type_id") `);
        await queryRunner.query(
            `CREATE TABLE "account_deletions" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "status" varchar NOT NULL DEFAULT 'PENDING', "created_at" timestamp NOT NULL DEFAULT now(), "updated_at" timestamp NOT NULL DEFAULT now(), "test1" varchar NOT NULL, "test2" varchar NOT NULL, "user_id" uuid, CONSTRAINT "REL_b359fd5c47945357b8ab9c3f78" UNIQUE ("user_id"), CONSTRAINT "PK_4d5b2aea48b5d5777b3421ec05c" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_b359fd5c47945357b8ab9c3f78" ON "account_deletions" ("user_id") `);
        await queryRunner.query(
            `CREATE TABLE "coins" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" varchar NOT NULL, "flag" varchar NOT NULL, "exchange_rate" float8 NOT NULL, "acronym" varchar NOT NULL, "is_active" bool NOT NULL DEFAULT false, CONSTRAINT "UQ_993837d2b265542b6fe77e3362d" UNIQUE ("acronym"), CONSTRAINT "PK_af01e5dcef2c05e6385611205c6" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "autoconverts" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "is_active" bool NOT NULL DEFAULT false, "percent" int8 NOT NULL DEFAULT (100), "created_at" timestamp NOT NULL DEFAULT now(), "updated_at" timestamp NOT NULL DEFAULT now(), "user_id" uuid, "coin_id" uuid, CONSTRAINT "REL_933260a2154bbe110922767290" UNIQUE ("user_id"), CONSTRAINT "PK_8d34ff37f3b7442d13f781913d9" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_933260a2154bbe110922767290" ON "autoconverts" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_ccef4d7a6bf488bee32bacdd98" ON "autoconverts" ("coin_id") `);
        await queryRunner.query(
            `CREATE TABLE "auth_tokens" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "refresh_token" string NOT NULL, "user_id" uuid, CONSTRAINT "PK_41e9ddfbb32da18c4e85e45c2fd" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_9691367d446cd8b18f462c191b" ON "auth_tokens" ("user_id") `);
        await queryRunner.query(
            `CREATE TABLE "automatic_buys" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "target_amount" decimal(15,2) NOT NULL DEFAULT (0), "amount" decimal(15,2) NOT NULL DEFAULT (0), "status" varchar NOT NULL, "created_at" timestamp NOT NULL DEFAULT now(), "updated_at" timestamp NOT NULL DEFAULT now(), "expiry" timestamp NOT NULL, "user_id" uuid, "coin_id" uuid, CONSTRAINT "PK_f4c04c58c7a0ca76f5214fe194c" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_9c140d462cab09d27e350829dc" ON "automatic_buys" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_491775ed0617d9341f74058ba3" ON "automatic_buys" ("coin_id") `);
        await queryRunner.query(
            `CREATE TABLE "bank_account_types" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" varchar NOT NULL, CONSTRAINT "PK_306bb2ca22a1dc5075c064cab54" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "countries" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" varchar NOT NULL, "code" varchar NOT NULL, "flag" varchar(1000), CONSTRAINT "PK_b2d7006793e8697ab3ae2deff18" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "banks" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" varchar NOT NULL, "usd_code" int8 NOT NULL, "gtq_code" int8 NOT NULL, "image" varchar NOT NULL DEFAULT 'https://firebasestorage.googleapis.com/v0/b/osmowallet.appspot.com/o/banks%2Flogo-default.png?alt=media&token=c1d3be47-e6b3-42b5-b2be-130c438b9e13', "country_id" uuid, CONSTRAINT "PK_3975b5f684ec241e3901db62d77" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_47446872bbbcdfe74738c31fff" ON "banks" ("country_id") `);
        await queryRunner.query(
            `CREATE TABLE "bank_accounts" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "account_number" varchar NOT NULL, "account_holder" varchar NOT NULL, "created_at" timestamp NOT NULL DEFAULT now(), "updated_at" timestamp NOT NULL DEFAULT now(), "user_id" uuid, "bank_account_type_id" uuid, "coin_id" uuid, "bank_id" uuid, CONSTRAINT "PK_c872de764f2038224a013ff25ed" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_29146c4a8026c77c712e01d922" ON "bank_accounts" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_f4ce621bc399c5956762c553a7" ON "bank_accounts" ("bank_account_type_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_b4ef41f663b6b6560f5dd791c2" ON "bank_accounts" ("coin_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_482543ba26483726aaa00d3917" ON "bank_accounts" ("bank_id") `);
        await queryRunner.query(
            `CREATE TABLE "blockchain_networks" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" varchar NOT NULL, "logo" varchar NOT NULL, CONSTRAINT "PK_c40c5b98b3f781c4e2feb56e4c5" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "cashpak_users" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "customerId" varchar NOT NULL, "token" string NOT NULL, "expiry" timestamp NOT NULL, "phone" varchar NOT NULL, "user_id" uuid, CONSTRAINT "REL_70945c54f2ae862a005a3d6780" UNIQUE ("user_id"), CONSTRAINT "PK_a77e298513b8ac9b7f8d8cc5599" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_70945c54f2ae862a005a3d6780" ON "cashpak_users" ("user_id") `);
        await queryRunner.query(
            `CREATE TABLE "cashpak_tokens" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "access_token" string NOT NULL, CONSTRAINT "PK_06ff18a2ab262f74ad135f20b9e" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "funding_method_coins" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "funding_method_id" uuid, "coin_id" uuid, CONSTRAINT "PK_3ed49fd84b102e385abab2787b7" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_506ef2b00c9e6d434424d403e5" ON "funding_method_coins" ("funding_method_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_edf5e4556d916327877a038244" ON "funding_method_coins" ("coin_id") `);
        await queryRunner.query(
            `CREATE TABLE "funding_methods" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" varchar NOT NULL, "min" decimal(15,2) NOT NULL DEFAULT (0), "max" decimal(15,2) NOT NULL DEFAULT (0), "fee" decimal(15,3) NOT NULL DEFAULT (0), "isActive" bool NOT NULL DEFAULT true, "title" varchar NOT NULL DEFAULT 'TITLE', "description" varchar NOT NULL, "estimate_time" varchar NOT NULL DEFAULT 'Inmediate', CONSTRAINT "PK_58c41b663f3e2216f6315793ed5" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "country_fundings" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "country_code" varchar NOT NULL DEFAULT 'GT', "is_active" bool NOT NULL DEFAULT true, "funding_id" uuid, CONSTRAINT "PK_50ce875222e7f530aeebda9e120" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_c380a7e1cc69b62f0da220094a" ON "country_fundings" ("funding_id") `);
        await queryRunner.query(
            `CREATE TABLE "withdrawal_method_coins" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "withdrawal_method_id" uuid, "coin_id" uuid, CONSTRAINT "PK_f522c3d8cf7cfdfcfc2cf981e67" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_e36e30f7402cd35b7c4d8a3722" ON "withdrawal_method_coins" ("withdrawal_method_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_2e7b545738e9aff15254e8c1c0" ON "withdrawal_method_coins" ("coin_id") `);
        await queryRunner.query(
            `CREATE TABLE "withdrawal_methods" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" varchar NOT NULL, "min" decimal(15,2) NOT NULL DEFAULT (0), "max" decimal(15,2) NOT NULL DEFAULT (0), "fee" decimal(15,3) NOT NULL DEFAULT (0), "isActive" bool NOT NULL DEFAULT true, "title" varchar NOT NULL DEFAULT 'TITLE', "description" varchar NOT NULL, "estimateTime" varchar DEFAULT 'Inmediate', CONSTRAINT "PK_770cde47c6c03d39272b8f19a31" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "country_withdraws" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "country_code" varchar NOT NULL DEFAULT 'GT', "is_active" bool NOT NULL DEFAULT true, "withdraw_id" uuid, CONSTRAINT "PK_118529cffa13372cb94d06ca7e0" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_7003eef70d124c49e4c1504cf6" ON "country_withdraws" ("withdraw_id") `);
        await queryRunner.query(
            `CREATE TABLE "feature_platforms" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "platform" varchar, "active" bool NOT NULL DEFAULT true, "feature_id" uuid, CONSTRAINT "PK_e0e3c29bf67f41d615864cd5382" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_a0f2e916b47cce93c1e27c4ee6" ON "feature_platforms" ("feature_id") `);
        await queryRunner.query(
            `CREATE TABLE "features" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" varchar NOT NULL, "is_active" bool NOT NULL DEFAULT true, CONSTRAINT "PK_5c1e336df2f4a7051e5bf08a941" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "feature_countries" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "active" bool NOT NULL DEFAULT true, "feature_id" uuid, "country_id" uuid, CONSTRAINT "PK_ebb2ec8411ac4e08f6d39b9406b" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_1f1559ab95ac6fe966a2f2f836" ON "feature_countries" ("feature_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_8176699031b6f2574f814aa7e9" ON "feature_countries" ("country_id") `);
        await queryRunner.query(
            `CREATE TABLE "global_payments" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "quoteId" varchar, "amount" decimal(15,3) NOT NULL DEFAULT (0), "currency" varchar NOT NULL DEFAULT 'USD', "sats" int8 NOT NULL DEFAULT (0), "address" varchar(1000), "status" varchar NOT NULL, "partner" varchar NOT NULL, "flow" varchar, "payoutId" varchar, CONSTRAINT "PK_9e71efc05fe8b9940487bcabc8e" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "global_payment_countries" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "is_active" bool NOT NULL DEFAULT true, "partner" varchar NOT NULL, "country_id" uuid, CONSTRAINT "REL_df3518e9e6454334626765e97c" UNIQUE ("country_id"), CONSTRAINT "PK_18119e97879b0eec1c5c231ec92" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_df3518e9e6454334626765e97c" ON "global_payment_countries" ("country_id") `);
        await queryRunner.query(
            `CREATE TABLE "ibex_tokens" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "access_token" string NOT NULL, "refresh_token" string NOT NULL, CONSTRAINT "PK_5304e9215472eb11537d8be9701" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "ibex_accounts" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "account" varchar NOT NULL, "name" varchar NOT NULL, "username_id" varchar, "created_at" timestamp NOT NULL DEFAULT now(), "updated_at" timestamp NOT NULL DEFAULT now(), "user_id" uuid, CONSTRAINT "REL_2c1d56946fcacad3909da119fa" UNIQUE ("user_id"), CONSTRAINT "PK_33f2bb98d940ea5bfa386dfba6b" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_2c1d56946fcacad3909da119fa" ON "ibex_accounts" ("user_id") `);
        await queryRunner.query(
            `CREATE TABLE "historic_rate" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" timestamp NOT NULL DEFAULT now(), "updated_at" timestamp NOT NULL DEFAULT now(), CONSTRAINT "PK_e6a006738ff41d621d41061416f" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "historic_coin_rate" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "exchange_rate" float8 NOT NULL, "historic_rate_id" uuid, "coin_id" uuid, CONSTRAINT "PK_283d7944e49abec7ce2362d5776" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_3033e37cfd362c54e97e74e2b4" ON "historic_coin_rate" ("historic_rate_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_73c28c1346a2c01804cdcde04d" ON "historic_coin_rate" ("coin_id") `);
        await queryRunner.query(
            `CREATE TABLE "kyc_steps" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" varchar NOT NULL, "created_at" timestamp NOT NULL DEFAULT now(), "updated_at" timestamp NOT NULL DEFAULT now(), CONSTRAINT "PK_3f272a04cb6a7ac4ab2541bdd61" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "kyc_verifications" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "status" varchar NOT NULL DEFAULT 'VERIFIED', "duplicated" bool NOT NULL DEFAULT false, "verification_id" varchar NOT NULL, "attemps" int8 NOT NULL DEFAULT (0), "created_at" timestamp NOT NULL DEFAULT now(), "updated_at" timestamp NOT NULL DEFAULT now(), "user_id" uuid, CONSTRAINT "REL_1e23c7821d740b4881f773c39a" UNIQUE ("user_id"), CONSTRAINT "PK_57b7c6b141dd225ce5dc95d7fb0" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_1e23c7821d740b4881f773c39a" ON "kyc_verifications" ("user_id") `);
        await queryRunner.query(
            `CREATE TABLE "kyc_verification_steps" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "verified" bool NOT NULL DEFAULT false, "error" varchar, "created_at" timestamp NOT NULL DEFAULT now(), "updated_at" timestamp NOT NULL DEFAULT now(), "kyc_verification_id" uuid, "kyc_step_id" uuid, CONSTRAINT "PK_6038442795379a0f5a5031bdbd8" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_99729c51601bbcd7ffc24e0567" ON "kyc_verification_steps" ("kyc_verification_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_c07b18c692f32638250f717a5f" ON "kyc_verification_steps" ("kyc_step_id") `);
        await queryRunner.query(
            `CREATE TABLE "osmo_bank_accounts" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "account_number" varchar NOT NULL, "account_name" varchar NOT NULL, "created_at" timestamp NOT NULL DEFAULT now(), "updated_at" timestamp NOT NULL DEFAULT now(), "bank_account_type_id" uuid, "coin_id" uuid, "bank_id" uuid, CONSTRAINT "PK_5309246aa45f9db4ea8fb93c784" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_3de7b6f94193ef505188eaa38b" ON "osmo_bank_accounts" ("bank_account_type_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_792824eecab17343d2e3968c83" ON "osmo_bank_accounts" ("coin_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_fbe826ad018a8928d4fc8ed8aa" ON "osmo_bank_accounts" ("bank_id") `);
        await queryRunner.query(
            `CREATE TABLE "osmo_blockchain_network_addresses" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "address" varchar NOT NULL, "networkId" uuid, CONSTRAINT "PK_2b20ac2e5c63517dd173e9969c8" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_f58782d7468e7ffea55fb40218" ON "osmo_blockchain_network_addresses" ("networkId") `);
        await queryRunner.query(`CREATE TYPE "public"."otp_codes_type_enum" AS ENUM('AUTH', 'VERIFY')`);
        await queryRunner.query(
            `CREATE TABLE "otp_codes" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "input" varchar, "otp" int8 NOT NULL, "type" "public"."otp_codes_type_enum" NOT NULL, "expiry" timestamp NOT NULL, "user_id" uuid, CONSTRAINT "PK_9d0487965ac1837d57fec4d6a26" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_318b850fc020b1e0f8670f66e1" ON "otp_codes" ("user_id") `);
        await queryRunner.query(
            `CREATE TABLE "osmo_business_bpts" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" varchar NOT NULL, "bpt_name" varchar NOT NULL, "bpt_url" varchar NOT NULL, "logo" varchar(1000), "logo_path" varchar(100), "created_at" timestamp NOT NULL DEFAULT now(), "updated_at" timestamp NOT NULL DEFAULT now(), CONSTRAINT "PK_738dea986a628a133cbf12a93e6" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "partner_tokens" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "refresh_token" string NOT NULL, "app_id" uuid, CONSTRAINT "PK_4fb3a834fbf8e16b35f8be0047e" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_1d6b12fdea2c6d5ed3fc27f724" ON "partner_tokens" ("app_id") `);
        await queryRunner.query(
            `CREATE TABLE "platform_types" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" varchar NOT NULL, CONSTRAINT "PK_53ef9b673b027d91c334d4dfa15" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "periods" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" varchar NOT NULL, CONSTRAINT "PK_86c6afb6c818d97dc321898627c" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."preferences_fiat_coin_enum" AS ENUM('USD', 'GTQ', 'PAB', 'CRC', 'NIO', 'HNL', 'BZD', 'MXN', 'SVC')`,
        );
        await queryRunner.query(`CREATE TYPE "public"."preferences_crypto_coin_enum" AS ENUM('SATS', 'BTC')`);
        await queryRunner.query(
            `CREATE TABLE "preferences" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "fiat_coin" "public"."preferences_fiat_coin_enum" NOT NULL DEFAULT 'GTQ', "crypto_coin" "public"."preferences_crypto_coin_enum" NOT NULL DEFAULT 'SATS', "promotional_notification" bool NOT NULL DEFAULT true, "security_notification" bool NOT NULL DEFAULT true, "user_id" uuid, "ask_pin_id" uuid, CONSTRAINT "REL_34a542d34f1c75c43e78df2e67" UNIQUE ("user_id"), CONSTRAINT "PK_17f8855e4145192bbabd91a51be" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_34a542d34f1c75c43e78df2e67" ON "preferences" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_5acbe0118783083bb4a5e661ed" ON "preferences" ("ask_pin_id") `);
        await queryRunner.query(
            `CREATE TABLE "push_tokens" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "token" varchar, "created_at" timestamp NOT NULL DEFAULT now(), "user_id" uuid, "auth_token_id" uuid, CONSTRAINT "REL_01bba5fceedafc4aeeb6aba31a" UNIQUE ("auth_token_id"), CONSTRAINT "PK_32734e87f299c29ca3878861f4f" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_94c371aff70dedeb89dae39f44" ON "push_tokens" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_01bba5fceedafc4aeeb6aba31a" ON "push_tokens" ("auth_token_id") `);
        await queryRunner.query(
            `CREATE TABLE "recent_contacts" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "updated_at" timestamp NOT NULL, "user_id" uuid, "contact_id" uuid, CONSTRAINT "PK_8d9186ca456887516874f725bd9" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_6d713dc4bc87ef744c75343a61" ON "recent_contacts" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_922731c3e7eaac4af093953233" ON "recent_contacts" ("contact_id") `);
        await queryRunner.query(
            `CREATE TABLE "recurrent_buys" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "amount" float8 NOT NULL, "created_at" timestamp NOT NULL DEFAULT now(), "updated_at" timestamp NOT NULL DEFAULT now(), "time" time NOT NULL, "user_id" uuid, "period_id" uuid, "coin_id" uuid, CONSTRAINT "PK_a3a1215d243923a55967e21764f" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_ca8949dc54536b4d1addb1ff04" ON "recurrent_buys" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_5a483a562cf5a73fa65febf5d0" ON "recurrent_buys" ("period_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_0adab556b47bb2cfea92b1748d" ON "recurrent_buys" ("coin_id") `);
        await queryRunner.query(
            `CREATE TABLE "transaction_details" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "ibex_transaction_id" varchar, "address" varchar(1000), "proof" varchar(1000), "proof_path" varchar, "proof_expiry" timestamp, "metadata" string, "transaction_id" uuid, CONSTRAINT "REL_6334b14562af3c8a2fb29dab8a" UNIQUE ("transaction_id"), CONSTRAINT "PK_b9397af1203ca3a78ca6631e4b7" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_6334b14562af3c8a2fb29dab8a" ON "transaction_details" ("transaction_id") `);
        await queryRunner.query(
            `CREATE TABLE "transaction_subtypes" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" varchar NOT NULL, CONSTRAINT "PK_643059b007dc30e2187bdd1b11f" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "wallets" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "balance" decimal(15,3) NOT NULL DEFAULT (0), "available_balance" decimal(15,3) NOT NULL DEFAULT (0), "is_active" bool NOT NULL DEFAULT true, "created_at" timestamp NOT NULL DEFAULT now(), "updated_at" timestamp NOT NULL DEFAULT now(), "account_id" uuid, "coin_id" uuid, CONSTRAINT "PK_8402e5df5a30a229380e83e4f7e" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_3758a15697c5d6964552b6a9d1" ON "wallets" ("account_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_e39d170a0fc7c84a49ec9d60e5" ON "wallets" ("coin_id") `);
        await queryRunner.query(
            `CREATE TABLE "transactions" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "amount" decimal(15,3) NOT NULL DEFAULT (0), "balance" decimal(15,3) NOT NULL DEFAULT (0), "created_at" timestamp NOT NULL DEFAULT now(), "updated_at" timestamp NOT NULL DEFAULT now(), "wallet_id" uuid, "transaction_group_id" uuid, "transaction_subtype_id" uuid, CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_0b171330be0cb621f8d73b87a9" ON "transactions" ("wallet_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_b7137c3934c8d9ca1865ce33a9" ON "transactions" ("transaction_group_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_2c2d6f124721b0b8e5aec39a8c" ON "transactions" ("transaction_subtype_id") `);
        await queryRunner.query(
            `CREATE TABLE "transaction_fees" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "amount" decimal(15,3) NOT NULL DEFAULT (0), "transaction_group_id" uuid, "coin_id" uuid, CONSTRAINT "PK_c4e068e018a1d34dab19b11b3a5" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_1b7d5bcdcb2c85d7ac267787e3" ON "transaction_fees" ("transaction_group_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_0fda5f8273c274e8479864de33" ON "transaction_fees" ("coin_id") `);
        await queryRunner.query(
            `CREATE TABLE "transaction_categories" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" varchar NOT NULL, "icon" int8 NOT NULL DEFAULT (61449), "from_user_id" uuid, CONSTRAINT "PK_bbd38b9174546b0ed4fe04689c7" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_56af85400b4f8183aa121d0650" ON "transaction_categories" ("from_user_id") `);
        await queryRunner.query(
            `CREATE TYPE "public"."transaction_groups_method_enum" AS ENUM('TRANSFER', 'CASH_FUNDING', 'STABLE_COIN', 'CREDIT_CARD', 'CASH_WITHDRAWAL')`,
        );
        await queryRunner.query(
            `CREATE TABLE "transaction_groups" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "type" varchar, "status" varchar NOT NULL DEFAULT 'PENDING', "btc_price" decimal(15,2), "note" varchar, "partner" varchar, "method" "public"."transaction_groups_method_enum", "metadata" string, "created_at" timestamp NOT NULL DEFAULT now(), "updated_at" timestamp NOT NULL DEFAULT now(), "transaction_category_id" uuid, "transaction_coin_id" uuid, "from_user_id" uuid, "to_user_id" uuid, "historicRateId" uuid, "osmo_bussiness_id" uuid, CONSTRAINT "PK_ca7afdb5c9d7bac0195e00c2e03" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_161a46f8e1c02cb97a613b086c" ON "transaction_groups" ("transaction_category_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_ea469a5d09d7c87a68a2392a7b" ON "transaction_groups" ("transaction_coin_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_2dfea44483ab268d7393c346d3" ON "transaction_groups" ("from_user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_50673e12f4efee75b0e15669d8" ON "transaction_groups" ("to_user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_a3f69d4a32d9556b48572f299b" ON "transaction_groups" ("historicRateId") `);
        await queryRunner.query(`CREATE INDEX "IDX_2a6be0c2e3e531350516b33e97" ON "transaction_groups" ("osmo_bussiness_id") `);
        await queryRunner.query(
            `CREATE TABLE "referrals" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "phone_number" varchar, "is_osmo_sponsor" bool NOT NULL DEFAULT false, "created_at" timestamp NOT NULL DEFAULT now(), "inviter_id" uuid, "invited_id" uuid, "transaction_group_id" uuid, CONSTRAINT "REL_9b3f9ac847774efa80663f344c" UNIQUE ("transaction_group_id"), CONSTRAINT "PK_ea9980e34f738b6252817326c08" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_4027e13ff4ec739b20403d1762" ON "referrals" ("inviter_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_81802f118f45c877bf3eece3d5" ON "referrals" ("invited_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_9b3f9ac847774efa80663f344c" ON "referrals" ("transaction_group_id") `);
        await queryRunner.query(
            `CREATE TABLE "sessions" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "platform" varchar NOT NULL DEFAULT 'ANDROID', "location" varchar NOT NULL, "device" varchar NOT NULL, "ip" varchar NOT NULL, "created_at" timestamp NOT NULL DEFAULT now(), "updated_at" timestamp NOT NULL DEFAULT now(), "user_id" uuid, "auth_token_id" uuid, CONSTRAINT "REL_adcd064347aaf352b0fa1a0c69" UNIQUE ("auth_token_id"), CONSTRAINT "PK_3238ef96f18b355b671619111bc" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_085d540d9f418cfbdc7bd55bb1" ON "sessions" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_adcd064347aaf352b0fa1a0c69" ON "sessions" ("auth_token_id") `);
        await queryRunner.query(
            `CREATE TABLE "tier_features" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "fee" decimal(15,3) NOT NULL DEFAULT (0), "min" decimal(15,2) NOT NULL DEFAULT (0), "max" decimal(15,2) NOT NULL DEFAULT (0), "daily_limit" decimal(15,2) NOT NULL DEFAULT (0), "monthly_limit" decimal(15,2) NOT NULL DEFAULT (0), "feature_id" uuid, "tier_id" uuid, CONSTRAINT "PK_80760f51380e649d5106a57c332" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_5b93ce41593d45801218295857" ON "tier_features" ("feature_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_7e78005ee0987ad0b6a30e5792" ON "tier_features" ("tier_id") `);
        await queryRunner.query(
            `CREATE TABLE "tier_users" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "user_id" uuid, "tier_id" uuid, CONSTRAINT "REL_83f35cc60fa50c95abfcf5e5d2" UNIQUE ("user_id"), CONSTRAINT "PK_b91d10a75906f45e6ee265e7010" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_83f35cc60fa50c95abfcf5e5d2" ON "tier_users" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_d526b480cfd0b1dc15c83e1d54" ON "tier_users" ("tier_id") `);
        await queryRunner.query(
            `CREATE TABLE "tiers" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" varchar NOT NULL, "from" decimal(15,2) NOT NULL DEFAULT (0), "to" decimal(15,2) NOT NULL DEFAULT (0), CONSTRAINT "PK_908405492b9b2c2ae1cea1e1cc0" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "partner_config" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "min" int8 NOT NULL DEFAULT (0), "max" int8 NOT NULL DEFAULT (0), "normal_fee" decimal(15,3) NOT NULL DEFAULT (0), "withdraw_fee" decimal(15,3) NOT NULL DEFAULT (0), CONSTRAINT "PK_c0169e701a9742ed3e1eba3fef7" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "settings" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "type" varchar NOT NULL, "name" varchar NOT NULL, "description" varchar NOT NULL, "value" varchar NOT NULL, CONSTRAINT "PK_0669fe20e252eb692bf4d344975" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "blockchain_network_addresses" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "address" varchar NOT NULL, "user_id" uuid, "networkId" uuid, CONSTRAINT "PK_d1e03b4e3ef880de80b706c6404" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_4a9278df1d460f4274ca0f417d" ON "blockchain_network_addresses" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_bd2b255e407326f688cd1e7afc" ON "blockchain_network_addresses" ("networkId") `);
        await queryRunner.query(
            `CREATE TABLE "user_transaction_limits" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "daily_amassed_amount" decimal(15,2) NOT NULL DEFAULT (0), "monthly_amassed_amount" decimal(15,2) NOT NULL DEFAULT (0), "user_id" uuid, "feature_id" uuid, CONSTRAINT "PK_63377019a04c42fe585641b01df" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_e0de882df5dbf68f2f7efa54d0" ON "user_transaction_limits" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_fd63fc3f7cf26b51640cdd774a" ON "user_transaction_limits" ("feature_id") `);
        await queryRunner.query(
            `CREATE TABLE "wallet_history" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "balance" decimal(15,3) NOT NULL DEFAULT (0), "available_balance" decimal(15,3) NOT NULL DEFAULT (0), "created_at" timestamp NOT NULL DEFAULT now(), "updated_at" timestamp NOT NULL DEFAULT now(), "date" timestamp NOT NULL, "wallet_id" uuid, CONSTRAINT "PK_d753e93ce16ad3202f03980aef6" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_b4f1a70fbc037d312126616242" ON "wallet_history" ("wallet_id") `);
        await queryRunner.query(
            `ALTER TABLE "verifications" ADD CONSTRAINT "FK_e9a134af366776c651168916616" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "addresses" ADD CONSTRAINT "FK_16aac8a9f6f9c1dd6bcb75ec023" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "user_roles" ADD CONSTRAINT "FK_87b8888186ca9769c960e926870" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "user_roles" ADD CONSTRAINT "FK_b23c65e50a758245a33ee35fda1" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "nits" ADD CONSTRAINT "FK_76da22567cf596e5a99e3dd50d9" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "accounts" ADD CONSTRAINT "FK_3000dad1da61b29953f07476324" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "accounts" ADD CONSTRAINT "FK_f4ab929cd365ac8a66fd8e42022" FOREIGN KEY ("account_type_id") REFERENCES "account_types"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "account_deletions" ADD CONSTRAINT "FK_b359fd5c47945357b8ab9c3f78a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "autoconverts" ADD CONSTRAINT "FK_933260a2154bbe1109227672908" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "autoconverts" ADD CONSTRAINT "FK_ccef4d7a6bf488bee32bacdd983" FOREIGN KEY ("coin_id") REFERENCES "coins"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "auth_tokens" ADD CONSTRAINT "FK_9691367d446cd8b18f462c191b3" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "automatic_buys" ADD CONSTRAINT "FK_9c140d462cab09d27e350829dcb" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "automatic_buys" ADD CONSTRAINT "FK_491775ed0617d9341f74058ba33" FOREIGN KEY ("coin_id") REFERENCES "coins"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "banks" ADD CONSTRAINT "banks_country_fk" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "bank_accounts" ADD CONSTRAINT "FK_29146c4a8026c77c712e01d922b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "bank_accounts" ADD CONSTRAINT "FK_f4ce621bc399c5956762c553a75" FOREIGN KEY ("bank_account_type_id") REFERENCES "bank_account_types"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "bank_accounts" ADD CONSTRAINT "FK_b4ef41f663b6b6560f5dd791c2e" FOREIGN KEY ("coin_id") REFERENCES "coins"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "bank_accounts" ADD CONSTRAINT "FK_482543ba26483726aaa00d39174" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "cashpak_users" ADD CONSTRAINT "FK_70945c54f2ae862a005a3d6780f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "funding_method_coins" ADD CONSTRAINT "FK_506ef2b00c9e6d434424d403e56" FOREIGN KEY ("funding_method_id") REFERENCES "funding_methods"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "funding_method_coins" ADD CONSTRAINT "FK_edf5e4556d916327877a038244c" FOREIGN KEY ("coin_id") REFERENCES "coins"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "country_fundings" ADD CONSTRAINT "FK_c380a7e1cc69b62f0da220094ab" FOREIGN KEY ("funding_id") REFERENCES "funding_methods"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "withdrawal_method_coins" ADD CONSTRAINT "FK_e36e30f7402cd35b7c4d8a3722c" FOREIGN KEY ("withdrawal_method_id") REFERENCES "withdrawal_methods"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "withdrawal_method_coins" ADD CONSTRAINT "FK_2e7b545738e9aff15254e8c1c03" FOREIGN KEY ("coin_id") REFERENCES "coins"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "country_withdraws" ADD CONSTRAINT "FK_7003eef70d124c49e4c1504cf64" FOREIGN KEY ("withdraw_id") REFERENCES "withdrawal_methods"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
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
            `ALTER TABLE "global_payment_countries" ADD CONSTRAINT "global_payment_countries_country_fk" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "ibex_accounts" ADD CONSTRAINT "FK_2c1d56946fcacad3909da119fa1" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "historic_coin_rate" ADD CONSTRAINT "FK_3033e37cfd362c54e97e74e2b47" FOREIGN KEY ("historic_rate_id") REFERENCES "historic_rate"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "historic_coin_rate" ADD CONSTRAINT "FK_73c28c1346a2c01804cdcde04dc" FOREIGN KEY ("coin_id") REFERENCES "coins"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "kyc_verifications" ADD CONSTRAINT "FK_1e23c7821d740b4881f773c39aa" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "kyc_verification_steps" ADD CONSTRAINT "FK_99729c51601bbcd7ffc24e0567e" FOREIGN KEY ("kyc_verification_id") REFERENCES "kyc_verifications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "kyc_verification_steps" ADD CONSTRAINT "FK_c07b18c692f32638250f717a5f2" FOREIGN KEY ("kyc_step_id") REFERENCES "kyc_steps"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "osmo_bank_accounts" ADD CONSTRAINT "FK_3de7b6f94193ef505188eaa38b9" FOREIGN KEY ("bank_account_type_id") REFERENCES "bank_account_types"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "osmo_bank_accounts" ADD CONSTRAINT "FK_792824eecab17343d2e3968c837" FOREIGN KEY ("coin_id") REFERENCES "coins"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "osmo_bank_accounts" ADD CONSTRAINT "FK_fbe826ad018a8928d4fc8ed8aad" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "osmo_blockchain_network_addresses" ADD CONSTRAINT "FK_f58782d7468e7ffea55fb402180" FOREIGN KEY ("networkId") REFERENCES "blockchain_networks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "otp_codes" ADD CONSTRAINT "FK_318b850fc020b1e0f8670f66e12" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "partner_tokens" ADD CONSTRAINT "FK_1d6b12fdea2c6d5ed3fc27f724c" FOREIGN KEY ("app_id") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "preferences" ADD CONSTRAINT "FK_34a542d34f1c75c43e78df2e67a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "preferences" ADD CONSTRAINT "FK_5acbe0118783083bb4a5e661eda" FOREIGN KEY ("ask_pin_id") REFERENCES "periods"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "push_tokens" ADD CONSTRAINT "FK_94c371aff70dedeb89dae39f440" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "push_tokens" ADD CONSTRAINT "FK_01bba5fceedafc4aeeb6aba31a9" FOREIGN KEY ("auth_token_id") REFERENCES "auth_tokens"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "recent_contacts" ADD CONSTRAINT "FK_6d713dc4bc87ef744c75343a61a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "recent_contacts" ADD CONSTRAINT "FK_922731c3e7eaac4af0939532337" FOREIGN KEY ("contact_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "recurrent_buys" ADD CONSTRAINT "FK_ca8949dc54536b4d1addb1ff047" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "recurrent_buys" ADD CONSTRAINT "FK_5a483a562cf5a73fa65febf5d04" FOREIGN KEY ("period_id") REFERENCES "periods"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "recurrent_buys" ADD CONSTRAINT "FK_0adab556b47bb2cfea92b1748db" FOREIGN KEY ("coin_id") REFERENCES "coins"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "transaction_details" ADD CONSTRAINT "FK_6334b14562af3c8a2fb29dab8ac" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "wallets" ADD CONSTRAINT "FK_3758a15697c5d6964552b6a9d1c" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "wallets" ADD CONSTRAINT "FK_e39d170a0fc7c84a49ec9d60e58" FOREIGN KEY ("coin_id") REFERENCES "coins"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "transactions" ADD CONSTRAINT "FK_0b171330be0cb621f8d73b87a9e" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "transactions" ADD CONSTRAINT "FK_b7137c3934c8d9ca1865ce33a94" FOREIGN KEY ("transaction_group_id") REFERENCES "transaction_groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "transactions" ADD CONSTRAINT "FK_2c2d6f124721b0b8e5aec39a8cb" FOREIGN KEY ("transaction_subtype_id") REFERENCES "transaction_subtypes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "transaction_fees" ADD CONSTRAINT "FK_1b7d5bcdcb2c85d7ac267787e33" FOREIGN KEY ("transaction_group_id") REFERENCES "transaction_groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "transaction_fees" ADD CONSTRAINT "FK_0fda5f8273c274e8479864de335" FOREIGN KEY ("coin_id") REFERENCES "coins"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "transaction_categories" ADD CONSTRAINT "FK_56af85400b4f8183aa121d06501" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "transaction_groups" ADD CONSTRAINT "FK_161a46f8e1c02cb97a613b086ca" FOREIGN KEY ("transaction_category_id") REFERENCES "transaction_categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "transaction_groups" ADD CONSTRAINT "FK_ea469a5d09d7c87a68a2392a7b4" FOREIGN KEY ("transaction_coin_id") REFERENCES "coins"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "transaction_groups" ADD CONSTRAINT "FK_2dfea44483ab268d7393c346d39" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "transaction_groups" ADD CONSTRAINT "FK_50673e12f4efee75b0e15669d82" FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "transaction_groups" ADD CONSTRAINT "FK_a3f69d4a32d9556b48572f299ba" FOREIGN KEY ("historicRateId") REFERENCES "historic_rate"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "transaction_groups" ADD CONSTRAINT "FK_2a6be0c2e3e531350516b33e974" FOREIGN KEY ("osmo_bussiness_id") REFERENCES "osmo_business_bpts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" ADD CONSTRAINT "FK_4027e13ff4ec739b20403d1762b" FOREIGN KEY ("inviter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" ADD CONSTRAINT "FK_81802f118f45c877bf3eece3d5b" FOREIGN KEY ("invited_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "referrals" ADD CONSTRAINT "FK_9b3f9ac847774efa80663f344ce" FOREIGN KEY ("transaction_group_id") REFERENCES "transaction_groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "sessions" ADD CONSTRAINT "FK_085d540d9f418cfbdc7bd55bb19" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "sessions" ADD CONSTRAINT "FK_adcd064347aaf352b0fa1a0c697" FOREIGN KEY ("auth_token_id") REFERENCES "auth_tokens"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "tier_features" ADD CONSTRAINT "FK_5b93ce41593d458012182958570" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "tier_features" ADD CONSTRAINT "FK_7e78005ee0987ad0b6a30e57922" FOREIGN KEY ("tier_id") REFERENCES "tiers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "tier_users" ADD CONSTRAINT "FK_83f35cc60fa50c95abfcf5e5d22" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "tier_users" ADD CONSTRAINT "FK_d526b480cfd0b1dc15c83e1d54e" FOREIGN KEY ("tier_id") REFERENCES "tiers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "blockchain_network_addresses" ADD CONSTRAINT "FK_4a9278df1d460f4274ca0f417df" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "blockchain_network_addresses" ADD CONSTRAINT "FK_bd2b255e407326f688cd1e7afcd" FOREIGN KEY ("networkId") REFERENCES "blockchain_networks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "user_transaction_limits" ADD CONSTRAINT "FK_e0de882df5dbf68f2f7efa54d08" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "user_transaction_limits" ADD CONSTRAINT "FK_fd63fc3f7cf26b51640cdd774a6" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "wallet_history" ADD CONSTRAINT "FK_b4f1a70fbc037d3121266162429" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wallet_history" DROP CONSTRAINT "FK_b4f1a70fbc037d3121266162429"`);
        await queryRunner.query(`ALTER TABLE "user_transaction_limits" DROP CONSTRAINT "FK_fd63fc3f7cf26b51640cdd774a6"`);
        await queryRunner.query(`ALTER TABLE "user_transaction_limits" DROP CONSTRAINT "FK_e0de882df5dbf68f2f7efa54d08"`);
        await queryRunner.query(`ALTER TABLE "blockchain_network_addresses" DROP CONSTRAINT "FK_bd2b255e407326f688cd1e7afcd"`);
        await queryRunner.query(`ALTER TABLE "blockchain_network_addresses" DROP CONSTRAINT "FK_4a9278df1d460f4274ca0f417df"`);
        await queryRunner.query(`ALTER TABLE "tier_users" DROP CONSTRAINT "FK_d526b480cfd0b1dc15c83e1d54e"`);
        await queryRunner.query(`ALTER TABLE "tier_users" DROP CONSTRAINT "FK_83f35cc60fa50c95abfcf5e5d22"`);
        await queryRunner.query(`ALTER TABLE "tier_features" DROP CONSTRAINT "FK_7e78005ee0987ad0b6a30e57922"`);
        await queryRunner.query(`ALTER TABLE "tier_features" DROP CONSTRAINT "FK_5b93ce41593d458012182958570"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_adcd064347aaf352b0fa1a0c697"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_085d540d9f418cfbdc7bd55bb19"`);
        await queryRunner.query(`ALTER TABLE "referrals" DROP CONSTRAINT "FK_9b3f9ac847774efa80663f344ce"`);
        await queryRunner.query(`ALTER TABLE "referrals" DROP CONSTRAINT "FK_81802f118f45c877bf3eece3d5b"`);
        await queryRunner.query(`ALTER TABLE "referrals" DROP CONSTRAINT "FK_4027e13ff4ec739b20403d1762b"`);
        await queryRunner.query(`ALTER TABLE "transaction_groups" DROP CONSTRAINT "FK_2a6be0c2e3e531350516b33e974"`);
        await queryRunner.query(`ALTER TABLE "transaction_groups" DROP CONSTRAINT "FK_a3f69d4a32d9556b48572f299ba"`);
        await queryRunner.query(`ALTER TABLE "transaction_groups" DROP CONSTRAINT "FK_50673e12f4efee75b0e15669d82"`);
        await queryRunner.query(`ALTER TABLE "transaction_groups" DROP CONSTRAINT "FK_2dfea44483ab268d7393c346d39"`);
        await queryRunner.query(`ALTER TABLE "transaction_groups" DROP CONSTRAINT "FK_ea469a5d09d7c87a68a2392a7b4"`);
        await queryRunner.query(`ALTER TABLE "transaction_groups" DROP CONSTRAINT "FK_161a46f8e1c02cb97a613b086ca"`);
        await queryRunner.query(`ALTER TABLE "transaction_categories" DROP CONSTRAINT "FK_56af85400b4f8183aa121d06501"`);
        await queryRunner.query(`ALTER TABLE "transaction_fees" DROP CONSTRAINT "FK_0fda5f8273c274e8479864de335"`);
        await queryRunner.query(`ALTER TABLE "transaction_fees" DROP CONSTRAINT "FK_1b7d5bcdcb2c85d7ac267787e33"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_2c2d6f124721b0b8e5aec39a8cb"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_b7137c3934c8d9ca1865ce33a94"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_0b171330be0cb621f8d73b87a9e"`);
        await queryRunner.query(`ALTER TABLE "wallets" DROP CONSTRAINT "FK_e39d170a0fc7c84a49ec9d60e58"`);
        await queryRunner.query(`ALTER TABLE "wallets" DROP CONSTRAINT "FK_3758a15697c5d6964552b6a9d1c"`);
        await queryRunner.query(`ALTER TABLE "transaction_details" DROP CONSTRAINT "FK_6334b14562af3c8a2fb29dab8ac"`);
        await queryRunner.query(`ALTER TABLE "recurrent_buys" DROP CONSTRAINT "FK_0adab556b47bb2cfea92b1748db"`);
        await queryRunner.query(`ALTER TABLE "recurrent_buys" DROP CONSTRAINT "FK_5a483a562cf5a73fa65febf5d04"`);
        await queryRunner.query(`ALTER TABLE "recurrent_buys" DROP CONSTRAINT "FK_ca8949dc54536b4d1addb1ff047"`);
        await queryRunner.query(`ALTER TABLE "recent_contacts" DROP CONSTRAINT "FK_922731c3e7eaac4af0939532337"`);
        await queryRunner.query(`ALTER TABLE "recent_contacts" DROP CONSTRAINT "FK_6d713dc4bc87ef744c75343a61a"`);
        await queryRunner.query(`ALTER TABLE "push_tokens" DROP CONSTRAINT "FK_01bba5fceedafc4aeeb6aba31a9"`);
        await queryRunner.query(`ALTER TABLE "push_tokens" DROP CONSTRAINT "FK_94c371aff70dedeb89dae39f440"`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP CONSTRAINT "FK_5acbe0118783083bb4a5e661eda"`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP CONSTRAINT "FK_34a542d34f1c75c43e78df2e67a"`);
        await queryRunner.query(`ALTER TABLE "partner_tokens" DROP CONSTRAINT "FK_1d6b12fdea2c6d5ed3fc27f724c"`);
        await queryRunner.query(`ALTER TABLE "otp_codes" DROP CONSTRAINT "FK_318b850fc020b1e0f8670f66e12"`);
        await queryRunner.query(`ALTER TABLE "osmo_blockchain_network_addresses" DROP CONSTRAINT "FK_f58782d7468e7ffea55fb402180"`);
        await queryRunner.query(`ALTER TABLE "osmo_bank_accounts" DROP CONSTRAINT "FK_fbe826ad018a8928d4fc8ed8aad"`);
        await queryRunner.query(`ALTER TABLE "osmo_bank_accounts" DROP CONSTRAINT "FK_792824eecab17343d2e3968c837"`);
        await queryRunner.query(`ALTER TABLE "osmo_bank_accounts" DROP CONSTRAINT "FK_3de7b6f94193ef505188eaa38b9"`);
        await queryRunner.query(`ALTER TABLE "kyc_verification_steps" DROP CONSTRAINT "FK_c07b18c692f32638250f717a5f2"`);
        await queryRunner.query(`ALTER TABLE "kyc_verification_steps" DROP CONSTRAINT "FK_99729c51601bbcd7ffc24e0567e"`);
        await queryRunner.query(`ALTER TABLE "kyc_verifications" DROP CONSTRAINT "FK_1e23c7821d740b4881f773c39aa"`);
        await queryRunner.query(`ALTER TABLE "historic_coin_rate" DROP CONSTRAINT "FK_73c28c1346a2c01804cdcde04dc"`);
        await queryRunner.query(`ALTER TABLE "historic_coin_rate" DROP CONSTRAINT "FK_3033e37cfd362c54e97e74e2b47"`);
        await queryRunner.query(`ALTER TABLE "ibex_accounts" DROP CONSTRAINT "FK_2c1d56946fcacad3909da119fa1"`);
        await queryRunner.query(`ALTER TABLE "global_payment_countries" DROP CONSTRAINT "global_payment_countries_country_fk"`);
        await queryRunner.query(`ALTER TABLE "feature_countries" DROP CONSTRAINT "feature_countries_country_fk"`);
        await queryRunner.query(`ALTER TABLE "feature_countries" DROP CONSTRAINT "FK_1f1559ab95ac6fe966a2f2f836c"`);
        await queryRunner.query(`ALTER TABLE "feature_platforms" DROP CONSTRAINT "FK_a0f2e916b47cce93c1e27c4ee6d"`);
        await queryRunner.query(`ALTER TABLE "country_withdraws" DROP CONSTRAINT "FK_7003eef70d124c49e4c1504cf64"`);
        await queryRunner.query(`ALTER TABLE "withdrawal_method_coins" DROP CONSTRAINT "FK_2e7b545738e9aff15254e8c1c03"`);
        await queryRunner.query(`ALTER TABLE "withdrawal_method_coins" DROP CONSTRAINT "FK_e36e30f7402cd35b7c4d8a3722c"`);
        await queryRunner.query(`ALTER TABLE "country_fundings" DROP CONSTRAINT "FK_c380a7e1cc69b62f0da220094ab"`);
        await queryRunner.query(`ALTER TABLE "funding_method_coins" DROP CONSTRAINT "FK_edf5e4556d916327877a038244c"`);
        await queryRunner.query(`ALTER TABLE "funding_method_coins" DROP CONSTRAINT "FK_506ef2b00c9e6d434424d403e56"`);
        await queryRunner.query(`ALTER TABLE "cashpak_users" DROP CONSTRAINT "FK_70945c54f2ae862a005a3d6780f"`);
        await queryRunner.query(`ALTER TABLE "bank_accounts" DROP CONSTRAINT "FK_482543ba26483726aaa00d39174"`);
        await queryRunner.query(`ALTER TABLE "bank_accounts" DROP CONSTRAINT "FK_b4ef41f663b6b6560f5dd791c2e"`);
        await queryRunner.query(`ALTER TABLE "bank_accounts" DROP CONSTRAINT "FK_f4ce621bc399c5956762c553a75"`);
        await queryRunner.query(`ALTER TABLE "bank_accounts" DROP CONSTRAINT "FK_29146c4a8026c77c712e01d922b"`);
        await queryRunner.query(`ALTER TABLE "banks" DROP CONSTRAINT "banks_country_fk"`);
        await queryRunner.query(`ALTER TABLE "automatic_buys" DROP CONSTRAINT "FK_491775ed0617d9341f74058ba33"`);
        await queryRunner.query(`ALTER TABLE "automatic_buys" DROP CONSTRAINT "FK_9c140d462cab09d27e350829dcb"`);
        await queryRunner.query(`ALTER TABLE "auth_tokens" DROP CONSTRAINT "FK_9691367d446cd8b18f462c191b3"`);
        await queryRunner.query(`ALTER TABLE "autoconverts" DROP CONSTRAINT "FK_ccef4d7a6bf488bee32bacdd983"`);
        await queryRunner.query(`ALTER TABLE "autoconverts" DROP CONSTRAINT "FK_933260a2154bbe1109227672908"`);
        await queryRunner.query(`ALTER TABLE "account_deletions" DROP CONSTRAINT "FK_b359fd5c47945357b8ab9c3f78a"`);
        await queryRunner.query(`ALTER TABLE "accounts" DROP CONSTRAINT "FK_f4ab929cd365ac8a66fd8e42022"`);
        await queryRunner.query(`ALTER TABLE "accounts" DROP CONSTRAINT "FK_3000dad1da61b29953f07476324"`);
        await queryRunner.query(`ALTER TABLE "nits" DROP CONSTRAINT "FK_76da22567cf596e5a99e3dd50d9"`);
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_b23c65e50a758245a33ee35fda1"`);
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_87b8888186ca9769c960e926870"`);
        await queryRunner.query(`ALTER TABLE "addresses" DROP CONSTRAINT "FK_16aac8a9f6f9c1dd6bcb75ec023"`);
        await queryRunner.query(`ALTER TABLE "verifications" DROP CONSTRAINT "FK_e9a134af366776c651168916616"`);
        await queryRunner.query(`DROP INDEX "wallet_history"@"IDX_b4f1a70fbc037d312126616242" CASCADE`);
        await queryRunner.query(`DROP TABLE "wallet_history"`);
        await queryRunner.query(`DROP INDEX "user_transaction_limits"@"IDX_fd63fc3f7cf26b51640cdd774a" CASCADE`);
        await queryRunner.query(`DROP INDEX "user_transaction_limits"@"IDX_e0de882df5dbf68f2f7efa54d0" CASCADE`);
        await queryRunner.query(`DROP TABLE "user_transaction_limits"`);
        await queryRunner.query(`DROP INDEX "blockchain_network_addresses"@"IDX_bd2b255e407326f688cd1e7afc" CASCADE`);
        await queryRunner.query(`DROP INDEX "blockchain_network_addresses"@"IDX_4a9278df1d460f4274ca0f417d" CASCADE`);
        await queryRunner.query(`DROP TABLE "blockchain_network_addresses"`);
        await queryRunner.query(`DROP TABLE "settings"`);
        await queryRunner.query(`DROP TABLE "partner_config"`);
        await queryRunner.query(`DROP TABLE "tiers"`);
        await queryRunner.query(`DROP INDEX "tier_users"@"IDX_d526b480cfd0b1dc15c83e1d54" CASCADE`);
        await queryRunner.query(`DROP INDEX "tier_users"@"IDX_83f35cc60fa50c95abfcf5e5d2" CASCADE`);
        await queryRunner.query(`DROP TABLE "tier_users"`);
        await queryRunner.query(`DROP INDEX "tier_features"@"IDX_7e78005ee0987ad0b6a30e5792" CASCADE`);
        await queryRunner.query(`DROP INDEX "tier_features"@"IDX_5b93ce41593d45801218295857" CASCADE`);
        await queryRunner.query(`DROP TABLE "tier_features"`);
        await queryRunner.query(`DROP INDEX "sessions"@"IDX_adcd064347aaf352b0fa1a0c69" CASCADE`);
        await queryRunner.query(`DROP INDEX "sessions"@"IDX_085d540d9f418cfbdc7bd55bb1" CASCADE`);
        await queryRunner.query(`DROP TABLE "sessions"`);
        await queryRunner.query(`DROP INDEX "referrals"@"IDX_9b3f9ac847774efa80663f344c" CASCADE`);
        await queryRunner.query(`DROP INDEX "referrals"@"IDX_81802f118f45c877bf3eece3d5" CASCADE`);
        await queryRunner.query(`DROP INDEX "referrals"@"IDX_4027e13ff4ec739b20403d1762" CASCADE`);
        await queryRunner.query(`DROP TABLE "referrals"`);
        await queryRunner.query(`DROP INDEX "transaction_groups"@"IDX_2a6be0c2e3e531350516b33e97" CASCADE`);
        await queryRunner.query(`DROP INDEX "transaction_groups"@"IDX_a3f69d4a32d9556b48572f299b" CASCADE`);
        await queryRunner.query(`DROP INDEX "transaction_groups"@"IDX_50673e12f4efee75b0e15669d8" CASCADE`);
        await queryRunner.query(`DROP INDEX "transaction_groups"@"IDX_2dfea44483ab268d7393c346d3" CASCADE`);
        await queryRunner.query(`DROP INDEX "transaction_groups"@"IDX_ea469a5d09d7c87a68a2392a7b" CASCADE`);
        await queryRunner.query(`DROP INDEX "transaction_groups"@"IDX_161a46f8e1c02cb97a613b086c" CASCADE`);
        await queryRunner.query(`DROP TABLE "transaction_groups"`);
        await queryRunner.query(`DROP TYPE "public"."transaction_groups_method_enum"`);
        await queryRunner.query(`DROP INDEX "transaction_categories"@"IDX_56af85400b4f8183aa121d0650" CASCADE`);
        await queryRunner.query(`DROP TABLE "transaction_categories"`);
        await queryRunner.query(`DROP INDEX "transaction_fees"@"IDX_0fda5f8273c274e8479864de33" CASCADE`);
        await queryRunner.query(`DROP INDEX "transaction_fees"@"IDX_1b7d5bcdcb2c85d7ac267787e3" CASCADE`);
        await queryRunner.query(`DROP TABLE "transaction_fees"`);
        await queryRunner.query(`DROP INDEX "transactions"@"IDX_2c2d6f124721b0b8e5aec39a8c" CASCADE`);
        await queryRunner.query(`DROP INDEX "transactions"@"IDX_b7137c3934c8d9ca1865ce33a9" CASCADE`);
        await queryRunner.query(`DROP INDEX "transactions"@"IDX_0b171330be0cb621f8d73b87a9" CASCADE`);
        await queryRunner.query(`DROP TABLE "transactions"`);
        await queryRunner.query(`DROP INDEX "wallets"@"IDX_e39d170a0fc7c84a49ec9d60e5" CASCADE`);
        await queryRunner.query(`DROP INDEX "wallets"@"IDX_3758a15697c5d6964552b6a9d1" CASCADE`);
        await queryRunner.query(`DROP TABLE "wallets"`);
        await queryRunner.query(`DROP TABLE "transaction_subtypes"`);
        await queryRunner.query(`DROP INDEX "transaction_details"@"IDX_6334b14562af3c8a2fb29dab8a" CASCADE`);
        await queryRunner.query(`DROP TABLE "transaction_details"`);
        await queryRunner.query(`DROP INDEX "recurrent_buys"@"IDX_0adab556b47bb2cfea92b1748d" CASCADE`);
        await queryRunner.query(`DROP INDEX "recurrent_buys"@"IDX_5a483a562cf5a73fa65febf5d0" CASCADE`);
        await queryRunner.query(`DROP INDEX "recurrent_buys"@"IDX_ca8949dc54536b4d1addb1ff04" CASCADE`);
        await queryRunner.query(`DROP TABLE "recurrent_buys"`);
        await queryRunner.query(`DROP INDEX "recent_contacts"@"IDX_922731c3e7eaac4af093953233" CASCADE`);
        await queryRunner.query(`DROP INDEX "recent_contacts"@"IDX_6d713dc4bc87ef744c75343a61" CASCADE`);
        await queryRunner.query(`DROP TABLE "recent_contacts"`);
        await queryRunner.query(`DROP INDEX "push_tokens"@"IDX_01bba5fceedafc4aeeb6aba31a" CASCADE`);
        await queryRunner.query(`DROP INDEX "push_tokens"@"IDX_94c371aff70dedeb89dae39f44" CASCADE`);
        await queryRunner.query(`DROP TABLE "push_tokens"`);
        await queryRunner.query(`DROP INDEX "preferences"@"IDX_5acbe0118783083bb4a5e661ed" CASCADE`);
        await queryRunner.query(`DROP INDEX "preferences"@"IDX_34a542d34f1c75c43e78df2e67" CASCADE`);
        await queryRunner.query(`DROP TABLE "preferences"`);
        await queryRunner.query(`DROP TYPE "public"."preferences_crypto_coin_enum"`);
        await queryRunner.query(`DROP TYPE "public"."preferences_fiat_coin_enum"`);
        await queryRunner.query(`DROP TABLE "periods"`);
        await queryRunner.query(`DROP TABLE "platform_types"`);
        await queryRunner.query(`DROP INDEX "partner_tokens"@"IDX_1d6b12fdea2c6d5ed3fc27f724" CASCADE`);
        await queryRunner.query(`DROP TABLE "partner_tokens"`);
        await queryRunner.query(`DROP TABLE "osmo_business_bpts"`);
        await queryRunner.query(`DROP INDEX "otp_codes"@"IDX_318b850fc020b1e0f8670f66e1" CASCADE`);
        await queryRunner.query(`DROP TABLE "otp_codes"`);
        await queryRunner.query(`DROP TYPE "public"."otp_codes_type_enum"`);
        await queryRunner.query(`DROP INDEX "osmo_blockchain_network_addresses"@"IDX_f58782d7468e7ffea55fb40218" CASCADE`);
        await queryRunner.query(`DROP TABLE "osmo_blockchain_network_addresses"`);
        await queryRunner.query(`DROP INDEX "osmo_bank_accounts"@"IDX_fbe826ad018a8928d4fc8ed8aa" CASCADE`);
        await queryRunner.query(`DROP INDEX "osmo_bank_accounts"@"IDX_792824eecab17343d2e3968c83" CASCADE`);
        await queryRunner.query(`DROP INDEX "osmo_bank_accounts"@"IDX_3de7b6f94193ef505188eaa38b" CASCADE`);
        await queryRunner.query(`DROP TABLE "osmo_bank_accounts"`);
        await queryRunner.query(`DROP INDEX "kyc_verification_steps"@"IDX_c07b18c692f32638250f717a5f" CASCADE`);
        await queryRunner.query(`DROP INDEX "kyc_verification_steps"@"IDX_99729c51601bbcd7ffc24e0567" CASCADE`);
        await queryRunner.query(`DROP TABLE "kyc_verification_steps"`);
        await queryRunner.query(`DROP INDEX "kyc_verifications"@"IDX_1e23c7821d740b4881f773c39a" CASCADE`);
        await queryRunner.query(`DROP TABLE "kyc_verifications"`);
        await queryRunner.query(`DROP TABLE "kyc_steps"`);
        await queryRunner.query(`DROP INDEX "historic_coin_rate"@"IDX_73c28c1346a2c01804cdcde04d" CASCADE`);
        await queryRunner.query(`DROP INDEX "historic_coin_rate"@"IDX_3033e37cfd362c54e97e74e2b4" CASCADE`);
        await queryRunner.query(`DROP TABLE "historic_coin_rate"`);
        await queryRunner.query(`DROP TABLE "historic_rate"`);
        await queryRunner.query(`DROP INDEX "ibex_accounts"@"IDX_2c1d56946fcacad3909da119fa" CASCADE`);
        await queryRunner.query(`DROP TABLE "ibex_accounts"`);
        await queryRunner.query(`DROP TABLE "ibex_tokens"`);
        await queryRunner.query(`DROP INDEX "global_payment_countries"@"IDX_df3518e9e6454334626765e97c" CASCADE`);
        await queryRunner.query(`DROP TABLE "global_payment_countries"`);
        await queryRunner.query(`DROP TABLE "global_payments"`);
        await queryRunner.query(`DROP INDEX "feature_countries"@"IDX_8176699031b6f2574f814aa7e9" CASCADE`);
        await queryRunner.query(`DROP INDEX "feature_countries"@"IDX_1f1559ab95ac6fe966a2f2f836" CASCADE`);
        await queryRunner.query(`DROP TABLE "feature_countries"`);
        await queryRunner.query(`DROP TABLE "features"`);
        await queryRunner.query(`DROP INDEX "feature_platforms"@"IDX_a0f2e916b47cce93c1e27c4ee6" CASCADE`);
        await queryRunner.query(`DROP TABLE "feature_platforms"`);
        await queryRunner.query(`DROP INDEX "country_withdraws"@"IDX_7003eef70d124c49e4c1504cf6" CASCADE`);
        await queryRunner.query(`DROP TABLE "country_withdraws"`);
        await queryRunner.query(`DROP TABLE "withdrawal_methods"`);
        await queryRunner.query(`DROP INDEX "withdrawal_method_coins"@"IDX_2e7b545738e9aff15254e8c1c0" CASCADE`);
        await queryRunner.query(`DROP INDEX "withdrawal_method_coins"@"IDX_e36e30f7402cd35b7c4d8a3722" CASCADE`);
        await queryRunner.query(`DROP TABLE "withdrawal_method_coins"`);
        await queryRunner.query(`DROP INDEX "country_fundings"@"IDX_c380a7e1cc69b62f0da220094a" CASCADE`);
        await queryRunner.query(`DROP TABLE "country_fundings"`);
        await queryRunner.query(`DROP TABLE "funding_methods"`);
        await queryRunner.query(`DROP INDEX "funding_method_coins"@"IDX_edf5e4556d916327877a038244" CASCADE`);
        await queryRunner.query(`DROP INDEX "funding_method_coins"@"IDX_506ef2b00c9e6d434424d403e5" CASCADE`);
        await queryRunner.query(`DROP TABLE "funding_method_coins"`);
        await queryRunner.query(`DROP TABLE "cashpak_tokens"`);
        await queryRunner.query(`DROP INDEX "cashpak_users"@"IDX_70945c54f2ae862a005a3d6780" CASCADE`);
        await queryRunner.query(`DROP TABLE "cashpak_users"`);
        await queryRunner.query(`DROP TABLE "blockchain_networks"`);
        await queryRunner.query(`DROP INDEX "bank_accounts"@"IDX_482543ba26483726aaa00d3917" CASCADE`);
        await queryRunner.query(`DROP INDEX "bank_accounts"@"IDX_b4ef41f663b6b6560f5dd791c2" CASCADE`);
        await queryRunner.query(`DROP INDEX "bank_accounts"@"IDX_f4ce621bc399c5956762c553a7" CASCADE`);
        await queryRunner.query(`DROP INDEX "bank_accounts"@"IDX_29146c4a8026c77c712e01d922" CASCADE`);
        await queryRunner.query(`DROP TABLE "bank_accounts"`);
        await queryRunner.query(`DROP INDEX "banks"@"IDX_47446872bbbcdfe74738c31fff" CASCADE`);
        await queryRunner.query(`DROP TABLE "banks"`);
        await queryRunner.query(`DROP TABLE "countries"`);
        await queryRunner.query(`DROP TABLE "bank_account_types"`);
        await queryRunner.query(`DROP INDEX "automatic_buys"@"IDX_491775ed0617d9341f74058ba3" CASCADE`);
        await queryRunner.query(`DROP INDEX "automatic_buys"@"IDX_9c140d462cab09d27e350829dc" CASCADE`);
        await queryRunner.query(`DROP TABLE "automatic_buys"`);
        await queryRunner.query(`DROP INDEX "auth_tokens"@"IDX_9691367d446cd8b18f462c191b" CASCADE`);
        await queryRunner.query(`DROP TABLE "auth_tokens"`);
        await queryRunner.query(`DROP INDEX "autoconverts"@"IDX_ccef4d7a6bf488bee32bacdd98" CASCADE`);
        await queryRunner.query(`DROP INDEX "autoconverts"@"IDX_933260a2154bbe110922767290" CASCADE`);
        await queryRunner.query(`DROP TABLE "autoconverts"`);
        await queryRunner.query(`DROP TABLE "coins"`);
        await queryRunner.query(`DROP INDEX "account_deletions"@"IDX_b359fd5c47945357b8ab9c3f78" CASCADE`);
        await queryRunner.query(`DROP TABLE "account_deletions"`);
        await queryRunner.query(`DROP INDEX "accounts"@"IDX_f4ab929cd365ac8a66fd8e4202" CASCADE`);
        await queryRunner.query(`DROP INDEX "accounts"@"IDX_3000dad1da61b29953f0747632" CASCADE`);
        await queryRunner.query(`DROP TABLE "accounts"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP INDEX "nits"@"IDX_76da22567cf596e5a99e3dd50d" CASCADE`);
        await queryRunner.query(`DROP TABLE "nits"`);
        await queryRunner.query(`DROP INDEX "user_roles"@"IDX_b23c65e50a758245a33ee35fda" CASCADE`);
        await queryRunner.query(`DROP INDEX "user_roles"@"IDX_87b8888186ca9769c960e92687" CASCADE`);
        await queryRunner.query(`DROP TABLE "user_roles"`);
        await queryRunner.query(`DROP TABLE "roles"`);
        await queryRunner.query(`DROP INDEX "addresses"@"IDX_16aac8a9f6f9c1dd6bcb75ec02" CASCADE`);
        await queryRunner.query(`DROP TABLE "addresses"`);
        await queryRunner.query(`DROP INDEX "verifications"@"IDX_e9a134af366776c65116891661" CASCADE`);
        await queryRunner.query(`DROP TABLE "verifications"`);
        await queryRunner.query(`DROP TABLE "apps"`);
        await queryRunner.query(`DROP TABLE "account_types"`);
    }
}
