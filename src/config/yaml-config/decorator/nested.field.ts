import { Type } from "class-transformer";
import { applyDecorators } from "@nestjs/common";

export function NestedField<
    SchemaT extends Object
>(
    type: () => { new (...args: any[]): SchemaT }
) {
    return applyDecorators(
        (tg: Object, propKey: string | symbol) => {
            Reflect.defineMetadata("nested", true, tg, propKey);
            Reflect.defineMetadata("type", type(), tg, propKey);
        },
        Type(type)
    );
}





