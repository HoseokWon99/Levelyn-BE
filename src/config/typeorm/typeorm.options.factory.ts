import { ConfigService } from "@nestjs/config";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";

export function typeormOptionsFactory(config: ConfigService): TypeOrmModuleOptions {
    return {
        type: config.get<any>("DB_TYPE"),
        host: config.get<string>("DB_HOST")!,
        port: config.get<number>("DB_PORT") || 3306,
        username: config.get<string>("DB_USERNAME")!,
        password: config.get<string>("DB_PASSWORD")!,
        database: config.get<string>("DB_DATABASE")!,
        entities: [__dirname + '/../../**/*.model{.ts,.js}'],
        logging: true
    };
}