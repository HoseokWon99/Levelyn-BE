import { ApiProperty, ApiSchema } from "@nestjs/swagger";

@ApiSchema()
export class SseResponse {
    @ApiProperty({ type: "string" })
    id: string;
    @ApiProperty({ type: "string" })
    event: string;
    @ApiProperty({ type: "object", properties: {} })
    data: any;
}