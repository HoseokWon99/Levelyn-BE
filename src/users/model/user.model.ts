import { Column, Entity, PrimaryGeneratedColumn, JoinColumn, OneToOne } from "typeorm";
import { ModelBase } from "../../common";
import { Player } from "../../players/model";
import { Wallet } from "../../wallets/model";
import { Exclude, Type } from "class-transformer";
import { UserDTO } from "../dto";

@Entity("users")
export class User extends ModelBase<UserDTO> {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: "open_id", type: "varchar", unique: true })
    openId: string;

    @Exclude({ toPlainOnly: true })
    @Column({ name: "player_id", type: "integer", unique: true })
    playerId: number;

    @Exclude({ toPlainOnly: true })
    @Column({ name: "wallet_id", type: "integer", unique: true })
    walletId: number;

    @Column({ type: "varchar" })
    name: string;

    @Exclude({ toPlainOnly: true })
    @Type(() => Player)
    @OneToOne(() => Player, { cascade: ["insert"], onDelete: "CASCADE" })
    @JoinColumn({ name: "player_id" })
    player: Player;

    @Exclude({ toPlainOnly: true })
    @Type(() => Wallet)
    @OneToOne(() => Wallet, { cascade: ["insert"], onDelete: "CASCADE" })
    @JoinColumn({ name: "wallet_id" })
    wallet: Wallet;

    toDTO(): UserDTO {
        return {
            ...super.toDTO(),
            player: this.player.toDTO(),
            wallet: this.wallet.toDTO()
        };
    }
}