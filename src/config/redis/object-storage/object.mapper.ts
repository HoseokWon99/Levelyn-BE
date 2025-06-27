import { RedisHMap, RedisValueType, SchemaConstructor, SchemaKeyType } from "./types";
import { getSchemaConfig } from "./get.schema.config";
import { entries } from "@fxts/core";

export class ObjectMapper<SchemaT extends Object> {
    private readonly _config: [SchemaKeyType<SchemaT>, RedisValueType][];

    constructor(
        private readonly _Schema: SchemaConstructor<SchemaT>
    ) {
        this._config = [...entries(getSchemaConfig(this._Schema))]

    }

    async hMapToInstance(hMap: RedisHMap<SchemaT>): Promise<SchemaT> {
        const instance = new this._Schema();

        for (const [k, type] of this._config) {
            const v = hMap[k];

            switch (type) {
                case "string":
                    instance[k] = v as any;
                    break;
                case "number":
                    instance[k] = Number(v) as any;
                    break;
                case "boolean":
                    instance[k] = Boolean(Number(v)) as any;
                    break;
                case "datetime":
                    instance[k] = new Date(v!) as any;
                    break;
            }
        }

        return instance;
    }

    async instanceToHMapEntries(instance: Partial<SchemaT>): Promise<[SchemaKeyType<SchemaT>, string][]> {
        return this._config
            .filter(([k,]) => instance[k] !== undefined)
            .map(([k, type]) => {
                switch (type) {
                    case "boolean":
                        return [k, Number(instance[k]).toString()];
                    case "datetime" : {
                        return instance[k] instanceof Date
                            ? [k, instance[k].toISOString()]
                            : [k, new Date(instance[k] as any).toISOString()];
                    }
                    default:
                        return [k, String(instance[k])];
                }
        });
    }
}