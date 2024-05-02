import { Module } from '@nestjs/common';
import { AdminAuthModule } from './admin-auth/admin-auth.module';
import { AdminCoinsModule } from './admin-coins/admin-coins.module';
import { AdminDashboardModule } from './admin-dashboard/admin-dashboard.module';
import { AdminFeaturesModule } from './admin-features/admin-features.module';
import { AdminTransactionsModule } from './admin-transactions/admin-transactions.module';
import { AdminUsersModule } from './admin-users/admin-users.module';
import { OsmoBusinessModule } from './osmo-business/osmo-business.module';
import { AdminSettingsModule } from './admin-settings/admin-settings.module';
import { AdminMeModule } from './admin-me/admin-me.module';

@Module({
    imports: [
        AdminAuthModule,
        AdminCoinsModule,
        AdminDashboardModule,
        AdminFeaturesModule,
        AdminTransactionsModule,
        AdminUsersModule,
        OsmoBusinessModule,
        AdminSettingsModule,
        AdminMeModule,
    ],
    controllers: [],
})
export class AdminModule {}
