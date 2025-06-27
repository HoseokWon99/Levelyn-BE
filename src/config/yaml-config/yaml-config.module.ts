import { DynamicModule, Global, Module } from "@nestjs/common";
import { YamlConfigService } from "./yaml-config.service";

@Global()
@Module({
    providers: [YamlConfigService],
    exports: [YamlConfigService]
})
export class YamlConfigModule {
    static forFeature(
        Schemas: Array<{ new(...args: any[]): Object }>
    ): DynamicModule {

        const providers = Schemas.map(Schema => ({
            provide: Schema.name,
            useFactory: (yamlConfig: YamlConfigService) => {
                return yamlConfig.loadYamlConfig(Schema);
            },
            inject: [YamlConfigService]
        }));

        return {
            module: YamlConfigModule,
            providers,
            exports: providers
        };
    }
}