import { SkillDTO } from "../../../game/skills/dto";
import { PlayerOwningDTO } from "../player.owning.dto";

export type PlayerSkillDTO = PlayerOwningDTO<SkillDTO>;