import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ModelBase } from "../../../common";
import { Exclude, Type } from "class-transformer";
import { MonsterType } from "./moster.type.model";
import { MonsterDTO } from "../dto";

@Entity("monsters")
export class Monster extends ModelBase<MonsterDTO> {
    @PrimaryGeneratedColumn()
    id: number;

    @Exclude({ toPlainOnly: true })
    @Column({ name: "region_id", type: "integer" })
    regionId: number;

    @Exclude({ toPlainOnly: true })
    @Column({ name: "type_id", type: "integer" })
    typeId: number;

    @Column({ type: "varchar" })
    name: string;

    @Column({ type: "float" })
    hp: number;

    @Exclude({ toPlainOnly: true })
    @Type(() => MonsterType)
    @ManyToOne(() => MonsterType)
    @JoinColumn({ name: "type_id" })
    type: MonsterType;

    toDTO(): MonsterDTO {
        return {
            ...super.toDTO(),
            type: this.type.toDTO()
        }
    }
}