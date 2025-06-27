import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from "typeorm";
import { ItemType } from "./item.type.model";
import { Type } from "class-transformer";
import { ItemDTO } from "../dto";
import { ItemSubType } from "./item.sub-type.model";
import { ItemEffect } from "./item.effect.model";
import { OwnableBase } from "../../common";

@Entity("items")
export class Item extends OwnableBase<ItemDTO> {
    @Column({ name: "type_id", type: "integer" })
    typeId: number;

    @Column({ name: "sub_type_id", type: "integer", nullable: true })
    subTypeId: number | null;

    @Column({ name: "effect_id", type: "integer" })
    effectId: number;

    @Column({ type: "float" })
    weight: number;

    @Type(() => ItemType)
    @ManyToOne(() => ItemType)
    @JoinColumn({ name: "type_id" })
    type: ItemType;

    @Type(() => ItemSubType)
    @ManyToOne(() => ItemSubType)
    @JoinColumn({ name: "sub_type_id" })
    subType: ItemSubType | null;

    @OneToOne(() => ItemEffect, { lazy: true, cascade: ["insert"], onDelete: "CASCADE" })
    @JoinColumn({ name: "effect_id" })
    effect: Promise<ItemEffect>;

    toDTO(): ItemDTO {
        const { id, name, description } = this;

        return {
            id, name, description,
            type: this.subType ? this.subType.toDTO() : this.type.toDTO()
        };
    }
}