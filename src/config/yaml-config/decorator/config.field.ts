export interface ConfigFieldOptions {
    path?: string;
}

export function ConfigField(options: ConfigFieldOptions = {}) {
    return function (tg: any, propKey: string) {
        const path = options.path ?? propKey;
        Reflect.defineMetadata("path", path, tg, propKey);
    };
 }