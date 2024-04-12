import { IsISO31661Alpha2 } from "class-validator";


export class UpdateResidenceDto{

    @IsISO31661Alpha2()
    residence: string
}