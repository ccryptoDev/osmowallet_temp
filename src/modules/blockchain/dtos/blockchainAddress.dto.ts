import { IsString } from "class-validator";



export class CreateBlockChainAddress {

    @IsString()
    networkId: string

    @IsString()
    address: string
}