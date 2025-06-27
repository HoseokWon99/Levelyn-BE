export function ConfigSchema(root: string) {
    return function<
        Clazz extends { new (...args: any[]): {} }
    >(clazz: Clazz) {
        return class extends clazz {
            root = root;
        };
    };
}