import { Inject, Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { plainToInstance } from "class-transformer";
import { KakaoUserInfo } from "./data";
import { pipe, tap } from "@fxts/core";
import { validateOrReject } from "class-validator";


@Injectable()
export class KakaoOAuth2Service {
    private readonly _logger: Logger = new Logger(KakaoOAuth2Service.name);
    private readonly _userInfoURL: string;

    constructor(
        @Inject(HttpService)
        private readonly _httpService: HttpService,
        @Inject(ConfigService)
        config: ConfigService
    ) {
        this._userInfoURL = config.get<string>(
            "OAUTH2_KAKAO_USER_INFO_URL"
        )!;
    }

    async loadUserInfo(token: string): Promise<KakaoUserInfo> {
        return pipe(
            await this.sendRequest(token),
            data => plainToInstance(KakaoUserInfo, data),
            tap(async userInfo => await validateOrReject(userInfo)),
        )
    }

    private async sendRequest(token: string): Promise<any> {

        const { data } = await this._httpService.axiosRef.get(
            this._userInfoURL,
            {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type":  "application/x-www-form-urlencoded;charset=UTF-8"
                },
            }
        );

        return data;
    }
}