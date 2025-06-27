import { RedisValueType, SchemaConfig, SchemaConstructor } from "./types";
import { keys } from "@fxts/core";


export function getSchemaConfig<SchemaT extends Object>(
    Schema: SchemaConstructor<SchemaT>
): SchemaConfig<SchemaT> {
    const schema = new Schema();
    const entries: [keyof SchemaT, RedisValueType][] = [];

    for (const k of keys(schema)) {
        if (typeof schema[k] === 'function') continue;
        const type = Reflect.getMetadata("type", schema, k);
        type && entries.push([k, type])
    }

    return Object.fromEntries(entries) as SchemaConfig<SchemaT>;
}