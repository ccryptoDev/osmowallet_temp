import { AuthDto } from "./auth.dto";
import { OtpDto } from "./otp.dto";

export interface SignupOtpDto extends OtpDto, AuthDto{}