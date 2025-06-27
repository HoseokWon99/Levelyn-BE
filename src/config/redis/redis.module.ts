import { DynamicModule, Global, Module, Provider } from "@nestjs/common";
import Redis from "ioredis";
import { redisFactory } from "./redis.factory";
import { ConfigService } from "@nestjs/config";
import { RedisObjectStorage, getStorageToken, SchemaConstructor } from "./object-storage";
import { RedisCircularQueue } from "./redis.circular.queue";

@Global()
@Module({
  providers: [
    {
      provide: Redis,
      useFactory: redisFactory,
      inject: [ConfigService],
    },
    RedisCircularQueue
  ],
  exports: [Redis, RedisCircularQueue],
})
export class RedisModule {
  static forFeature(
      Schemas: SchemaConstructor<any>[]
  ): DynamicModule {

    const providers: Provider[] = Schemas.map(Schema => ({
      provide: getStorageToken(Schema),
      useFactory: (redis: Redis) => RedisObjectStorage.create(redis, Schema),
      inject: [Redis],
    }));

    return {
      module: RedisModule,
      providers: providers,
      exports: providers,
    };
  }
}