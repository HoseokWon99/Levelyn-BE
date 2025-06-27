import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { plainToInstance } from "class-transformer";

@Injectable()
export class YamlConfigService {
    constructor(
        @Inject(ConfigService)
        private readonly _configService: ConfigService,
    ) {}

    loadYamlConfig<
        SchemaT extends Object
    >(
        Schema: { new (...args: any[]): SchemaT }
    ): SchemaT {
        const schema = new Schema();
        const root: string = schema["root"];

        const data = plainToInstance(Schema, this.loadYamlConfigAux(schema, root));
        delete data["root"];

        return data;
    }

    private loadYamlConfigAux<
        SchemaT extends Object
    >(
        schema: SchemaT,
        root: string
    ): Record<string, any> {
        const result = {};

        for (const k of Object.keys(schema)) {
            if (typeof schema[k] === "function") continue;

            const path: string = Reflect.getMetadata("path", schema, k);
            if (!path) continue;

            const nested: boolean = Reflect.getMetadata("nested", schema, k);
            const totalPath = `${root}.${path}`;

            if (nested) {

                const Type: { new(...args: any[]): {} }
                    = Reflect.getMetadata("type", schema, k);

                result[k] = this.loadYamlConfigAux(new Type(), totalPath);
            }
            else {
                result[k] = this._configService.get(totalPath)!
            }
        }

        return result;
    }
}