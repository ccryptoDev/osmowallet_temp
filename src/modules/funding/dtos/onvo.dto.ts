import { IsMongoId } from "class-validator";


export class OnvoFundingDto {
    @IsMongoId()
    paymentMethodId: string
}