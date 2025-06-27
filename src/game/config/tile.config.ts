import { RewardConfig } from "./reward.config";
import { ConfigField, ConfigSchema, NestedField } from "../../config/yaml-config";

@ConfigSchema("TILE")
export class TileConfig {
    @ConfigField({ path: "BATTLE_EVENT_PROBABILITY" })
    pBattleEvent: number;

    @NestedField(() => RewardConfig)
    @ConfigField({ path: "REWARD" })
    reward: RewardConfig;
}