import { Module } from '@nestjs/common';
import { TypeOrmModule } from "@nestjs/typeorm";
import { Skill, SkillRequirement } from "./model";
import { SkillsService } from "./service";

@Module({
    imports: [TypeOrmModule.forFeature([Skill, SkillRequirement])],
    providers: [SkillsService],
    exports: [SkillsService]
})
export class SkillsModule {}
