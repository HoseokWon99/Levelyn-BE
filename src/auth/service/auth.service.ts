import { Inject, Injectable, Logger } from '@nestjs/common';
import { UsersService } from "../../users";
import { SignInDTO, SignInResult, UserInfo } from "../dto";
import { BlacklistService } from "./blacklist.service";
import { JwtAuthService } from "./jwt.auth.service";
import { omit, pipe } from "@fxts/core";

@Injectable()
export class AuthService {
    private readonly _logger: Logger = new Logger(AuthService.name);

    constructor(
        @Inject(UsersService)
        private readonly _usersService: UsersService,
        @Inject(JwtAuthService)
        private readonly _jwtAuthService: JwtAuthService,
        @Inject(BlacklistService)
        private readonly _blacklist: BlacklistService,
    ) {}

    async signIn(dto: SignInDTO): Promise<SignInResult> {
        const { id, player, wallet } = await this._usersService.upsertUser(dto);

        const accessToken = await this._jwtAuthService.signAccess({ id });
        const refreshToken = await this._jwtAuthService.signRefresh({ id });

        return { accessToken, refreshToken, player, wallet };
    }

    async signOut(authorization: string): Promise<void> {
        await this._blacklist.add(authorization);
    }

    async renew(refreshToken: string): Promise<string> {
        return pipe(
            await this._jwtAuthService.verify(refreshToken),
            userInfo => this._jwtAuthService.signAccess(userInfo)
        );
    }
}
