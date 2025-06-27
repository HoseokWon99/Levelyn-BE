import { ConfigService } from "@nestjs/config";
import { Random } from "random";
import { createRandom } from "./create-random";

export function randomFactory(config: ConfigService): Random {
    const seed = config.get<number>("RANDOM_SEED");
    return createRandom(seed);
}