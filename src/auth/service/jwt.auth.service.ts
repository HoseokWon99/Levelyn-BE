import { Inject, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { JWT_ACCESS_EXPIRES, JWT_REFRESH_EXPIRES, JWT_SECRET } from "../token";
import { TokenPayload, UserInfo } from "../dto";

@Injectable()
export class JwtAuthService {

    constructor(
        @Inject(JwtService)
        private readonly _jwtService: JwtService,
        @Inject(JWT_SECRET)
        private readonly _secret: string,
        @Inject(JWT_ACCESS_EXPIRES)
        private readonly _accessEx: number,
        @Inject(JWT_REFRESH_EXPIRES)
        private readonly _refreshEx: number
    ) {}

    async signAccess(user: UserInfo): Promise<string> {
        return await this.sign(user, this._accessEx);
    }

    async signRefresh(user: UserInfo): Promise<string> {
        return await this.sign(user, this._refreshEx);
    }

    async verify(token: string): Promise<UserInfo> {

        const { id, playerId, walletId } = await this._jwtService
            .verifyAsync<TokenPayload>(token, { secret: this._secret });

        return { id, playerId, walletId };
    }

    private async sign(user: UserInfo, ex: number): Promise<string> {
        return await this._jwtService.signAsync(
            user, { secret: this._secret, expiresIn: ex }
        );
    }
}