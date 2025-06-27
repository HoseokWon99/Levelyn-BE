import { Module } from '@nestjs/common';
import { TypeOrmModule } from "@nestjs/typeorm";
import { Wallet } from "./model";
import { WalletsListener } from "./wallets.listener";
import { WalletsService } from "./service/wallets.service";

@Module({
    imports: [TypeOrmModule.forFeature([Wallet])],
    providers: [WalletsListener, WalletsService],
    exports: [WalletsService]
})
export class WalletsModule {}
