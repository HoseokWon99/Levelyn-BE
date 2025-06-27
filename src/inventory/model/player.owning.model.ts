import { ModelBase } from "../../common";
import { Column, PrimaryGeneratedColumn } from "typeorm";
import { Exclude } from "class-transformer";
import { PlayerOwningDTO } from "../dto/player.owning.dto";

export abstract class PlayerOwning<
    OwnedT extends ModelBase<ModelBase.DTOType<OwnedT>>,
> extends ModelBase<
    PlayerOwningDTO<ModelBase.DTOType<OwnedT>>
> {
    @Exclude({ toPlainOnly: true })
    @PrimaryGeneratedColumn()
    id: number;

    @Exclude({ toPlainOnly: true })
    @Column({ name: "player_id", type: "integer" })
    playerId: number;

    @Column({ type: "boolean", default: false })
    equipped: boolean;

    toDTO(): PlayerOwningDTO<ModelBase.DTOType<OwnedT>> {
        return {
            ...this.owned().toDTO(),
            ...super.toDTO(),
        };
    }

    protected abstract owned(): OwnedT;
}