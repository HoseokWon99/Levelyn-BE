import { getSchemaConfig } from './get.schema.config';
import 'reflect-metadata';
import { ObjectField } from "./decorator";

class TestSchema {
    @ObjectField({ type: "string" })
    name: string;

    @ObjectField({ type: "number" })
    age: number;

    @ObjectField({ type: "datetime" })
    birthday: Date;

    @ObjectField({ type: "boolean" })
    married: boolean;

    method() {
        return 'method';
    }
}

Reflect.defineMetadata('type', 'string', TestSchema.prototype, 'name');
Reflect.defineMetadata('type', 'number', TestSchema.prototype, 'age');

describe('getSchemaConfig', () => {

    it('Extract properties which have metadata type and is not a method', () => {
        const config = getSchemaConfig(TestSchema);

        expect(config).toEqual({
            name: 'string',
            age: 'number',
            birthday: 'datetime',
            married: 'boolean'
        });
    });

    it('should ignore methods', () => {
        const config = getSchemaConfig(TestSchema);
        expect(config).not.toHaveProperty('method');
    });
});