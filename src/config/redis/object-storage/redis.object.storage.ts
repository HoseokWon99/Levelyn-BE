import { RedisHMap, SchemaConstructor, SchemaInstanceType, SchemaKeyType } from "./types";
import { Injectable } from "@nestjs/common";
import Redis from "ioredis";
import { getSchemaConfig } from "./get.schema.config";
import { keys } from "@fxts/core";
import { ObjectMapper } from "./object.mapper";

@Injectable()
export class RedisObjectStorage<SchemaT extends Object> {
   protected readonly _mapper: ObjectMapper<SchemaT>;
   protected readonly _fields: SchemaKeyType<SchemaT>[];

    constructor(
        protected readonly _redis: Redis,
        Schema: SchemaConstructor<SchemaT>,
    ) {
       this._mapper = new ObjectMapper(Schema);
       this._fields = [...keys(getSchemaConfig(Schema))];
    }

    async upsert(key: string, model: Partial<SchemaT>) {
        await this._redis.hmset(
            key,
            ...(await this._mapper.instanceToHMapEntries(model)).flat()
        );
    }

    async findOne(key: string): Promise<SchemaT> {
       return await this._redis.hmget(key, ...(this._fields as string[]))
           .then(vals => this.toHMap(vals))
           .then(hMap => this._mapper.hMapToInstance(hMap))
           .catch(err => { throw err; });
    }

    async findMany(pattern: string): Promise<SchemaT[]> {
       const results: SchemaT[] = [];
       const keys = await this._redis.keys(pattern);
       for (const k of keys) results.push(await this.findOne(k));
       return results;
    }

    protected toHMap(vals: (string | null)[]): RedisHMap<SchemaT> {
        return Object.fromEntries(
            this._fields.map((field, idx) => {
                return [field, vals[idx]];
            })
        ) as RedisHMap<SchemaT>;
    }

    static create<
        Sch extends SchemaConstructor<SchemaInstanceType<Sch>>
    >(redis: Redis, Schema: Sch): RedisObjectStorage<SchemaInstanceType<Sch>> {
        return new RedisObjectStorage(redis, Schema);
    }
}