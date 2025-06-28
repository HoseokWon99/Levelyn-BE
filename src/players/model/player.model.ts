import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { ModelBase } from "../../common";

@Entity("players")
export class Player extends ModelBase {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: "position", type: "integer", default: 0 })
    position: number;

    @Column({ type: "integer", default: 1 })
    level: number;

    @Column({ type: "float", default: 0.0 })
    exp: number;

    @Column({ type: "float", default: 10.0 })
    attack: number;

    @Column({ type: "float", default: 15.0 })
    will: number;
}