import { IsString } from "class-validator";

export class UpdateInvoiceDTO {
    @IsString()
    id: string

    @IsString()
    pr: string
  }