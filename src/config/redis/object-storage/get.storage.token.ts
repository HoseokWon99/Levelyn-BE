import { SchemaConstructor } from "./types";
import { InjectionToken } from "@nestjs/common";

export function getStorageToken<SchemaT extends Object>(
    Schema: SchemaConstructor<SchemaT>
): InjectionToken {
    return `${Schema.name.toUpperCase()}_STORAGE`;
}