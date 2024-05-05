import { IsNotEmpty, IsString } from "class-validator";


export class ProfilePictureDto{

    @IsString()
    @IsNotEmpty()
    hash: string
}