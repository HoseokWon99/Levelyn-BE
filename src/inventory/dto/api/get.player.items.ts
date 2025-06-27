import { PlayerItemSchema } from "./schema";
import { ApiExtraModels, ApiProperty } from "@nestjs/swagger";

@ApiExtraModels(PlayerItemSchema)
export class GetPlayerItemsResponse {
    @ApiProperty({ name: "results", type: [PlayerItemSchema] })
    results: PlayerItemSchema[]
}