import { ConfigField, ConfigSchema } from "../../config/yaml-config";

@ConfigSchema("REGION")
export class RegionConfig {
    @ConfigField({ path: "INTERVAL" })
    interval: number;
}