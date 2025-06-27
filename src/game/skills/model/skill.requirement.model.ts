import { ModelBase } from "../../../common";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { SkillRequirementDTO } from "../dto";
import { Exclude } from "class-transformer";

@Entity("skill_requirements")
export class SkillRequirement extends ModelBase<SkillRequirementDTO> {
    @Exclude()
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: "min_level", type: "integer" })
    minLevel: number;

    @Column({ name: "min_attack", type: "float" })
    minAttack: number;

    @Column({ name: "min_will", type: "float" })
    minWill: number;
}