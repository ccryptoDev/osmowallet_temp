import { IsEmail, IsIBAN, IsString } from "class-validator"


export class SolfinFundingDto {
    @IsIBAN()
    ibanFrom: string

    @IsString()
    nameFrom: string

    @IsEmail()
    emailFrom: string

    @IsString()
    documentFrom: string

    @IsString()
    documentTypeFrom: number

    @IsString()
    description: string = ''
}

// {
//     "ibanFrom": "CR51012300120067843001",
//     "nameFrom": "David Mauricio Díaz Medrano",
//     "emailFrom": "dmdiazm@yahoo.com",
//     "documentFrom": "132000104527",
//     "documentTypeFrom": "1",
//     "description": "osmo test"
// }