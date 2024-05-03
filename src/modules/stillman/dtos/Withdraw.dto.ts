import { IsNumber, IsString } from 'class-validator';

export class WithdrawDto {
    @IsString()
    assetCode!: string;

    @IsNumber()
    addressId!: number;

    @IsNumber()
    quantity!: number;
}
