import MersenneTwister = require("mersenne-twister");
import { Random } from "random";

export function createRandom(seed?: number): Random {
    const mt = new MersenneTwister(seed);
    return new Random(mt.random.bind(mt));
}