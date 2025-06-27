import { IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class SignInRequest {
    @ApiProperty()
    @IsString()
    token: string;
}

export class SignInResponse {
    @ApiProperty()
    @IsString()
    accessToken: string;
}