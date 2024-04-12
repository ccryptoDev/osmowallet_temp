import { IsNumber, IsPositive } from "class-validator";

export class BanxaBuyDto{

    @IsPositive()
    @IsNumber()
    amount: number
}