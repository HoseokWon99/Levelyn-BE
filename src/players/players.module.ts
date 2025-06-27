import { Module } from '@nestjs/common';
import { TypeOrmModule } from "@nestjs/typeorm";
import { Player } from "./model";
import { PlayersService } from './players.service';

@Module({
    imports: [TypeOrmModule.forFeature([Player])],
    providers: [PlayersService],
    exports: [PlayersService]
})
export class PlayersModule {}
