import { IsInt, IsString, IsUrl } from "class-validator"


export class CreateOsmoBusinessDto {

    @IsString()
    name: string

    @IsString()
    bptName: string
    
    @IsUrl()
    url: string  

    @IsInt({each: true})
    image: Array<number>
}