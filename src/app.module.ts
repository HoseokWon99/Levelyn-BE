import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { typeormOptionsFactory, typeormDataSourceFactory } from "./config/typeorm";
import { RedisModule } from "./config/redis";
import { HttpModule } from "@nestjs/axios";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { RandomModule } from "./config/random";
import { UsersModule } from './users';
import { PlayersModule } from './players';
import { WalletsModule } from './wallets';
import { AuthModule } from './auth';
import { ToDoModule } from "./to-do";
import { InventoryModule } from "./inventory";
import yamlConfig from "./config/yaml";
import { join } from "node:path";

@Module({
  imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: join(__dirname, "..", ".env"),
        load: [yamlConfig]
      }),
      TypeOrmModule.forRootAsync({
          useFactory: typeormOptionsFactory,
          dataSourceFactory: typeormDataSourceFactory,
          inject: [ConfigService]
      }),
      HttpModule.register({ global: true }),
      EventEmitterModule.forRoot({ global: true }),
      RedisModule,
      RandomModule,
      UsersModule,
      PlayersModule,
      WalletsModule,
      AuthModule,
      ToDoModule,
      InventoryModule
  ]
})
export class AppModule {}
