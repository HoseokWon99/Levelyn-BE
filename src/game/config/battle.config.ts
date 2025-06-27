import { RewardConfig } from "./reward.config";
import { ConfigField, ConfigSchema, NestedField } from "../../config/yaml-config";

@ConfigSchema("BATTLE")
export class BattleConfig {
    @ConfigField({ path: "DURATION" })
    duration: number;

    @NestedField(() => RewardConfig)
    @ConfigField({ path: "REWARD" })
    reward: RewardConfig;
}