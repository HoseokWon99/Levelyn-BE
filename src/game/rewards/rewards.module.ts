import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ItemRange, ItemsModule, RandomItemService } from "../items";
import { RandomBoxesService, RewardsService } from "./service";
import { OptionsProvider } from "../../common";
import { BATTLE_EXP_REWARD, ITEM_REWARD_PROBABILITY, MIN_COIN_REWARD, TILE_EXP_REWARD } from "../system";
import { IS_ITEM_REWARD, RANDOM_COIN_GENERATOR } from "./token";
import { Random } from "random";

const EXTERNAL_PROVIDERS = [RandomItemService];

@Module({
    imports: [
        TypeOrmModule.forFeature([ItemRange]),
        ItemsModule
    ],
    providers: [
        ...EXTERNAL_PROVIDERS,
        RewardsService,
        RandomBoxesService,
        OptionsProvider<number>(TILE_EXP_REWARD),
        OptionsProvider<number>(BATTLE_EXP_REWARD),
        OptionsProvider<number>(ITEM_REWARD_PROBABILITY),
        OptionsProvider<number>(MIN_COIN_REWARD),
        {
            provide: IS_ITEM_REWARD,
            useFactory: (rand: Random, p: number) => {
                const binomial = rand.binomial(1, p);
                return () => Boolean(binomial());
            },
            inject: [Random, ITEM_REWARD_PROBABILITY]
        },
        {
            provide: RANDOM_COIN_GENERATOR,
            useFactory: (rand: Random, alpha: number) => rand.pareto(alpha),
            inject: [Random, MIN_COIN_REWARD],
        }
    ],
    exports: [
        RewardsService,
        RandomBoxesService,
        IS_ITEM_REWARD,
        RANDOM_COIN_GENERATOR,
        ITEM_REWARD_PROBABILITY,
        MIN_COIN_REWARD,
        BATTLE_EXP_REWARD,
        TILE_EXP_REWARD,
        ...EXTERNAL_PROVIDERS
    ]
})
export class RewardsModule {}