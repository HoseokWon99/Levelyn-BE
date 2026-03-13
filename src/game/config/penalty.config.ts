import { ConfigField, ConfigSchema } from "../../config/yaml-config";

@ConfigSchema("PENALTY")
export class PenaltyConfig {
    @ConfigField({ path: "DURATION" })
    duration: number;
    @ConfigField({ path: "DEBUFF" })
    debuff: number;
}