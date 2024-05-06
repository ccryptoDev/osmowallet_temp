import { IsString } from "class-validator";

export class SendGloballyAddressDto {
    @IsString()
    address: string
}