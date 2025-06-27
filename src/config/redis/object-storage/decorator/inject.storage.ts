import { SchemaConstructor } from "../types";
import { Inject } from "@nestjs/common";
import { getStorageToken } from "../get.storage.token";

export function InjectStorage<
    SchemaT extends Object
>(Schema: SchemaConstructor<SchemaT>): PropertyDecorator & ParameterDecorator {
    return Inject(getStorageToken(Schema));
}