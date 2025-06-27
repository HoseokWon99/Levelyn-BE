import { ApiExtraModels, ApiProperty } from "@nestjs/swagger";
import { SkillSchema, PlayerSkillSchema } from "./schema";

@ApiExtraModels(SkillSchema, PlayerSkillSchema)
export class GetPlayerSkillsResponse {
    @ApiProperty({ name: 'skills', type: [SkillSchema] })
    skills: SkillSchema[];

    @ApiProperty({ name: 'playerSkills', type: [PlayerSkillSchema] })
    playerSkills: PlayerSkillSchema[];
}