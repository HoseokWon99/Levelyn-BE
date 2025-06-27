import { ConfigField, ConfigSchema } from "../../config/yaml-config";

@ConfigSchema("LEVEL")
export class LevelConfig {
    @ConfigField({ path: "MAX_EXP" })
    maxExp: number;

    @ConfigField({ path: "DELTA_ATTACK" })
    deltaAttack: number;

    @ConfigField({ path: "DELTA_WILL" })
    deltaWill: number;
}