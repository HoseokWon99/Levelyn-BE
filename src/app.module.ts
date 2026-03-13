import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { typeormOptionsFactory, typeormDataSourceFactory } from "./config/typeorm";
import { HttpModule } from "@nestjs/axios";
import { CqrsModule } from "@nestjs/cqrs";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { YamlConfigModule } from "./config/yaml-config";
import { RedisModule } from "./config/redis";
import { RandomModule } from "./config/random";
import { UsersModule } from './users';
import { StatesModule } from './states';
import { WalletsModule } from './wallets';
import { AuthModule } from './auth';
import { ToDoModule } from "./to-do";
import { InventoryModule } from "./inventory";
import yamlConfig from "./config/yaml";
import { join } from "node:path";
import { AppController } from "./app.controller";
import { TilesModule } from "./tiles";
import { RewardsModule } from "./rewards";
import { NotificationsModule } from "./notifications";
import { MyPagesModule } from "./my-pages";
import { BattlesModule } from "./battles";
import { MonitoringModule } from "./monitoring";

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
      CqrsModule.forRoot(),
      YamlConfigModule,
      RedisModule,
      RandomModule,
      UsersModule,
      StatesModule,
      WalletsModule,
      AuthModule,
      ToDoModule,
      InventoryModule,
      MyPagesModule,
      TilesModule,
      BattlesModule,
      RewardsModule,
      NotificationsModule,
      MonitoringModule
  ],
  controllers: [AppController],
})
export class AppModule {}
