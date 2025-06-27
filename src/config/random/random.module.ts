import { Global, Module } from "@nestjs/common";
import { Random } from "random";
import { randomFactory } from "./random.factory";
import { ConfigService } from "@nestjs/config";

@Global()
@Module({
    providers: [
        { provide: Random,  useFactory: randomFactory, inject: [ConfigService] }
    ],
    exports: [Random]
})
export class RandomModule {}