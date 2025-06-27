import { Module } from '@nestjs/common';
import { TypeOrmModule } from "@nestjs/typeorm";
import { PlayerItem, PlayerSkill } from "./model";
import { AuthModule, JwtAuthGuard } from "../auth";
import { PlayerItemsService, PlayerSkillsService } from "./service";
import { PlayerItemsController, PlayerSkillsController } from "./controller";
import { InventoryListener } from "./inventory.listener";
import { GameModule, Skill, SkillsService } from "../game";

const EXTERNAL_PROVIDERS = [JwtAuthGuard, SkillsService];

@Module({
  imports: [
      TypeOrmModule.forFeature([PlayerItem, PlayerSkill, Skill]),
      AuthModule,
      GameModule
  ],
  providers: [
      ...EXTERNAL_PROVIDERS,
      PlayerItemsService,
      PlayerSkillsService,
      InventoryListener
  ],
  controllers: [PlayerItemsController, PlayerSkillsController],
  exports: [PlayerItemsService, PlayerSkillsService]
})
export class InventoryModule {}
