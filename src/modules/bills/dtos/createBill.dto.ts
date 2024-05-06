import { IsNotEmpty } from "class-validator";


export class CreateBillDto {

    @IsNotEmpty()
    userId: string
}