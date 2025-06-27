import { Inject, Injectable, Logger } from "@nestjs/common";
import { JWT_ACCESS_EXPIRES } from "../token";
import Redis from "ioredis";

@Injectable()
export class BlacklistService {
    private readonly _logger: Logger = new Logger(BlacklistService.name);

    constructor(
        @Inject(JWT_ACCESS_EXPIRES)
        private readonly _expires: number,
        @Inject(Redis)
        private readonly _redis: Redis
    ) {}

    async add(authorization: string): Promise<void> {
       this._redis.set(
           authorization,
           new Date().toLocaleDateString(),
           "PX",
           this._expires
       );
    }

    async exists(authorization: string): Promise<boolean> {
        return !!(await this._redis.get(authorization));
    }
}