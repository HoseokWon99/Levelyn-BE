import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { ModelBase } from "../../common";
import { ToDoPeriod } from "./to-do.period.model";

@Entity("to_do_list")
export class ToDo extends ModelBase {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: "user_id", type: "integer" })
    userId: number;

    @Column({ name: "period_id", type: "integer", nullable: true })
    periodId: number | null;

    @Column({ type: "varchar" })
    description: string;

    @Column({
        type: "date"
    })
    date: Date;

    @Column({ name: "is_sub", type: "boolean", default: false })
    isSub: boolean;

    @Column({ type: "boolean", default: false })
    completed: boolean;

    @OneToOne(() => ToDoPeriod, { eager: true, onDelete: "CASCADE", cascade: ["insert", "update"] })
    @JoinColumn({ name: "period_id" })
    period: ToDoPeriod | null;
}

