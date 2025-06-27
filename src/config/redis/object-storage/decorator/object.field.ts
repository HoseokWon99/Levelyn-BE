import { ObjectFieldOptions } from "./object.field.options";

export function ObjectField(options: ObjectFieldOptions) {
    return function (tg: any, propKey: string | symbol) {
        for (const [k, v] of Object.entries(options))
            Reflect.defineMetadata(k, v, tg, propKey);
    };
}