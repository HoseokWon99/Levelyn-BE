import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { ModelBase } from "../../common";
import { Exclude } from 'class-transformer';
import { ToDoDTO } from "../dto";
import { ToDoPeriod } from "./to-do.period.model";
import { isSameDay } from "date-fns";

@Entity("to-do-list")
export class ToDo extends ModelBase<ToDoDTO> {
    @PrimaryGeneratedColumn()
    id: number;

    @Exclude({ toPlainOnly: true })
    @Column({ name: "user_id", type: "integer" })
    userId: number;

    @Exclude({ toPlainOnly: true })
    @Column({ name: "period_id", type: "integer", nullable: true })
    periodId: number | null;

    @Column({ type: "varchar" })
    description: string;

    @Column({ type: "date" })
    date: Date;

    @Column({ name: "is_sub", type: "boolean", default: false })
    isSub: boolean;

    @Column({ type: "boolean", default: false })
    completed: boolean;

    @Exclude({ toPlainOnly: true })
    @OneToOne(() => ToDoPeriod, { onDelete: "CASCADE", onUpdate: "CASCADE" })
    @JoinColumn({ name: "period_id" })
    period: ToDoPeriod | null;

    toDTO(): ToDoDTO {
        return {
            ...super.toDTO(),
            period: this.period && this.period.toDTO()
        };
    }
}

