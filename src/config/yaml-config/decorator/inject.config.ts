import { Inject } from "@nestjs/common";

export function InjectConfig(Schema: Function): PropertyDecorator & ParameterDecorator {
    return Inject(Schema.name);
}