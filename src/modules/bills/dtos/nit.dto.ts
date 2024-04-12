import { IsNotEmpty } from "class-validator";


export class NitDto {

    @IsNotEmpty()
    nit: string
}