import { ExecutionContext, Inject, Injectable, Logger } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";
import { BlacklistService } from "./service";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
    private readonly _logger: Logger = new Logger(JwtAuthGuard.name);

    constructor(
        @Inject(BlacklistService)
        private readonly _blacklist: BlacklistService
    ) { super(); }

    async canActivate(ctx: ExecutionContext): Promise<boolean> {

        const { authorization } = ctx.switchToHttp()
            .getRequest<Request>().headers;

        if (authorization && await this._blacklist.exists(authorization))
            return false;

        return await (super.canActivate(ctx) as Promise<boolean>);
    }

}