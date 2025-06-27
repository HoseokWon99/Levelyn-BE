import { Column, Entity, JoinColumn, OneToOne } from "typeorm";
import { SkillRequirement } from "./skill.requirement.model";
import { OwnableBase } from "../../common";
import { SkillDTO } from "../dto";
import { SkillEffect } from "./skill.effect.model";

@Entity("skills")
export class Skill extends OwnableBase<SkillDTO> {
    @Column({ name: "effect_id", type: "integer" })
    effectId: number;

    @Column({ name: "requirement_id", type: "integer" })
    requirementId: number;

    @OneToOne(() => SkillRequirement)
    @JoinColumn({ name: "requirement_id" })
    requirement: SkillRequirement;

    @OneToOne(() => SkillEffect, { lazy: true })
    @JoinColumn({ name: "effect_id" })
    effect: Promise<SkillEffect>;

    toDTO(): SkillDTO {
        return {
            id: this.id,
            name: this.name,
            description: this.description
        };
    }
}