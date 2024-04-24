import { registerAs } from "@nestjs/config";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { config as dotenvConfig } from 'dotenv';

import { DataSource, DataSourceOptions } from "typeorm";
dotenvConfig({ path: '.env.development' });

export const config: TypeOrmModuleOptions = {
    type: 'cockroachdb',
    url: new URL(process.env.DATABASE_URL).toString(),
    entities: ["src/entities/referral.source.entity{.ts,.js}"],
    migrations: ["src/migrations/1713992091403-UserReferralSource.ts"],
    ssl: true,    
    autoLoadEntities: true,
    synchronize: false,
    maxTransactionRetries: 100,
    retryAttempts: 100,
    logging: false,
    migrationsRun: process.env.DATABASE_MIGRATIONS_RUN === 'true',
    extra: {
        max: 2000, // Set maximum number of connections in the pool.
        min: 1000,  // Set minimum number of connections in the pool.
    },
}
export default registerAs('typeorm', () => config)
export const connectionSource = new DataSource(config as DataSourceOptions);
