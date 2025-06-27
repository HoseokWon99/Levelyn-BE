import { Module } from "@nestjs/common";
import { Skill, SkillsModule, SkillsService } from "./skills";
import { Item, ItemRange, ItemRangesService, ItemsModule, ItemsService, RandomItemService } from "./items";
import { Monster, MonstersModule, MonstersService } from "./monsters";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Region } from "./regions";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Item,
            ItemRange,
            Skill,
            Monster,
            Region
        ]),
        SkillsModule,
        ItemsModule,
        MonstersModule
    ],
    providers: [
        SkillsService,
        ItemsService,
        ItemRangesService,
        RandomItemService,
        MonstersService
    ],
    exports: [
        SkillsService,
        ItemsService,
        ItemRangesService,
        RandomItemService,
        MonstersService
    ]
})
export class GameModule {}