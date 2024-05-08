// src/common/utils/date-range.util.ts

import { TransactionMetricPeriod } from 'src/modules/admin/admin-users/enums/period.enum';

export function getDateRange(query: any) {
    const toDate = new Date();
    toDate.setHours(23, 59, 59, 999);
    const pastDate = new Date();
    pastDate.setHours(0, 0, 0, 0);

    let startDate = pastDate;
    let endDate = toDate;
    switch (query.period) {
        case TransactionMetricPeriod.M12:
            pastDate.setMonth(pastDate.getMonth() - 12);
            break;
        case TransactionMetricPeriod.M6:
            pastDate.setMonth(pastDate.getMonth() - 6);
            break;
        case TransactionMetricPeriod.M3:
            pastDate.setMonth(pastDate.getMonth() - 3);
            break;
        case TransactionMetricPeriod.D30:
            pastDate.setDate(pastDate.getDate() - 30);
            break;
        case TransactionMetricPeriod.D15:
            pastDate.setDate(pastDate.getDate() - 15);
            break;
        case TransactionMetricPeriod.D7:
            pastDate.setDate(pastDate.getDate() - 7);
            break;
        case TransactionMetricPeriod.YESTERDAY:
            toDate.setDate(toDate.getDate() - 1);
            startDate.setDate(pastDate.getDate() - 1);
            break;
        case TransactionMetricPeriod.TODAY:
            // For TODAY, pastDate is already set to the start of the day
            break;
        case TransactionMetricPeriod.CUSTOM:
            startDate = query.fromDate;
            endDate = query.toDate;
            break;
    }

    return { startDate, endDate };
}
