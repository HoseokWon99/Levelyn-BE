import { Column, Entity, PrimaryColumn } from "typeorm";
import { ModelBase } from "../../../common";
import { ItemRangeDTO } from "../dto";

@Entity("item_ranges")
export class ItemRange extends ModelBase<ItemRangeDTO> {
    @PrimaryColumn({ name: "item_id", type: "integer" })
    itemId: number;

    @Column({ type: "float" })
    upper: number;
}