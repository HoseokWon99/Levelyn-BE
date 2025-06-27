import { Column, Entity, PrimaryColumn } from "typeorm";
import { ModelBase } from "../../common";
import { Exclude } from "class-transformer";
import { GoalDTO } from "../dto";

@Entity("goals")
export class Goal extends ModelBase<GoalDTO> {
    @Exclude({ toPlainOnly: true })
    @PrimaryColumn({ name: "user_id", type: "integer" })
    userId: number;

    @Column({ type: "varchar" })
    description: string;

    @Column({ type: "date" })
    since: Date;

    @Column({ type: "date" })
    until: Date;
}