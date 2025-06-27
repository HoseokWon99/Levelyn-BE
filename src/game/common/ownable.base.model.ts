import { ModelBase } from "../../common";
import { Column, PrimaryGeneratedColumn } from "typeorm";
import { OwnableDTO } from "./ownable.dto";

export abstract class OwnableBase<
    DTO extends OwnableDTO
> extends ModelBase<DTO> {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "varchar" })
    name: string;

    @Column({ type: "varchar" })
    description: string;
}