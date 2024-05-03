import { Status } from 'src/common/enums/status.enum';

export interface UpdateProviderKyc {
    userId: string;
    status: Status;
}
