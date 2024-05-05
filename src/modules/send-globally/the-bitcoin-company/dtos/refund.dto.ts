import { IsString } from "class-validator";

export class RefundDTO {
    @IsString()
    id: string

    @IsString()
    pr: string
  }