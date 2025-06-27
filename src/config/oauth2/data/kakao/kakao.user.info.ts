import { IsNotEmpty, IsNumberString, ValidateNested } from "class-validator";
import { Expose, Type } from "class-transformer";
import { KakaoAccount } from "./kakao.account";

export class KakaoUserInfo {
    @IsNumberString()
    @IsNotEmpty()
    id: string;

    @ValidateNested()
    @Type(() => KakaoAccount)
    @Expose({ name: "kakao_account" })
    kakaoAccount: KakaoAccount;
}