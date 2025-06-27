import { Module } from '@nestjs/common';
import { MonstersService } from './monsters.service';
import { TypeOrmModule } from "@nestjs/typeorm";
import { Monster } from "./model";

@Module({
  imports: [TypeOrmModule.forFeature([Monster])],
  providers: [MonstersService],
  exports: [MonstersService]
})
export class MonstersModule {}
