import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { Skill } from "../../game";
import { Exclude, Type } from "class-transformer";
import { PlayerSkillDTO } from "../dto";
import { PlayerOwning } from "./player.owning.model";

@Entity("player_skills")
export class PlayerSkill extends PlayerOwning<Skill> {

    @Exclude({ toPlainOnly: true })
    @Column({ name: "skill_id", type: "integer" })
    skillId: number;

    @Exclude({ toPlainOnly: true })
    @Type(() => Skill)
    @ManyToOne(() => Skill)
    @JoinColumn({ name: "skill_id" })
    skill: Skill;

    toDTO(): PlayerSkillDTO {
        return super.toDTO();
    }

    protected owned(): Skill {
        return this.skill;
    }
}