import { IsString } from "class-validator";

export class ClabePayoutDTO {
    @IsString()
    clabe: string;
    @IsString()
    recipientName: string;
  }
  
  export class PhoneNumberPayoutDTO {
    @IsString()
    phoneNumber: string;
    @IsString()
    recipientName: string;
    @IsString()
    institutionNumber: string;
  }
  
  export class DebitCardPayoutDTO {
    @IsString()
    cardNumber: string;
    @IsString()
    recipientName: string;
    @IsString()
    institutionNumber: string;
  }
  
  export class PixPayoutDTO {
    @IsString()
    pixKey: string;
    @IsString()
    recipientName: string;
  }
  
  export type PayoutOptions = ClabePayoutDTO | PhoneNumberPayoutDTO | DebitCardPayoutDTO | PixPayoutDTO;