import { ModelBase } from "../../common";
import { TypeDTO } from "./type.dto";
import { Column, PrimaryGeneratedColumn } from "typeorm";

export abstract class TypeBase extends ModelBase<TypeDTO> {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "varchar" })
    value: string;
}