import Redis from "ioredis";
import { Inject, Injectable } from "@nestjs/common";

@Injectable()
export class RedisCircularQueue {

    constructor(
        @Inject(Redis)
        private readonly _redis: Redis
    ) {}

    async createQueue(key: string, ...vals: any[]): Promise<void> {
        await this._redis.rpush(key, ...vals);
    }

    async dequeue(key: string): Promise<string | null> {
        const val = await this._redis.lpop(key);
        val && await this._redis.rpush(key, val);
        return val;
    }
}