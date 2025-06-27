import { CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Exclude, instanceToPlain } from "class-transformer";

export abstract class ModelBase<DTO = any> {
    @Exclude({ toPlainOnly: true })
    @CreateDateColumn({ name: "created_at", type: "timestamp" })
    createdAt: Date;

    @Exclude({ toPlainOnly: true })
    @UpdateDateColumn({ name: "updated_at", type: "timestamp" })
    updatedAt: Date;

    toDTO(): DTO {
        return instanceToPlain(this)[0];
    }
}

export namespace ModelBase {
    export type DTOType<M extends ModelBase<any>>
        = M extends ModelBase<infer DTO> ? DTO : never;
}
