import { Inject, Injectable, Logger } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { JWT_SECRET } from "./token";
import { TokenPayload } from "./dto";
import { pick } from "@fxts/core";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
    private readonly _logger: Logger = new Logger(JwtStrategy.name);

    constructor(
        @Inject(JWT_SECRET) secret: string
    ) {
        super({
            secretOrKey: secret,
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
        });
    }

    async validate(payload: TokenPayload, done: Function): Promise<void> {
        done(null, pick(["id"], payload));
    }
}