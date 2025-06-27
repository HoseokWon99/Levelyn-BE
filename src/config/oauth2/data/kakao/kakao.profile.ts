import { IsNotEmpty, IsString } from "class-validator";

export class KakaoProfile {
    @IsString()
    @IsNotEmpty()
    nickname: string;
}