import { Module } from "@nestjs/common";
import { KakaoOAuth2Service } from "./kakao.oauth2.service";
import { KakaoOAuth2Guard } from "./kakao.oauth2.guard";

@Module({
    providers: [
        KakaoOAuth2Service,
        KakaoOAuth2Guard
    ],
    exports: [KakaoOAuth2Guard, KakaoOAuth2Service]
})
export class OAuth2Module {}