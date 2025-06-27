import { IsEmail, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { KakaoProfile } from "./kakao.profile";

export class KakaoAccount {
    @IsEmail()
    email: string;

    @ValidateNested()
    @Type(() => KakaoProfile)
    profile: KakaoProfile;
}