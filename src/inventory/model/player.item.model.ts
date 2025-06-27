import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { Exclude, Type } from "class-transformer";
import { Item } from "../../game";
import { PlayerItemDTO } from "../dto";
import { PlayerOwning } from "./player.owning.model";

@Entity("player_items")
export class PlayerItem extends PlayerOwning<Item> {

    @Exclude({ toPlainOnly: true })
    @Column({ name: "item_id", type: "integer" })
    itemId: number;

    @Exclude({ toPlainOnly: true })
    @Type(() => Item)
    @ManyToOne(() => Item)
    @JoinColumn({ name: "item_id" })
    item: Item;

    toDTO(): PlayerItemDTO {
        return super.toDTO();
    }

    protected owned(): Item {
        return this.item;
    }
}