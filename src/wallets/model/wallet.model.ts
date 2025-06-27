import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { ModelBase } from "../../common";
import { WalletDTO } from "../dto";
import { Exclude } from "class-transformer";

@Entity("wallets")
export class Wallet extends ModelBase<WalletDTO> {
    @Exclude({ toPlainOnly: true })
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'integer', default: 0 })
    coin: number;
}