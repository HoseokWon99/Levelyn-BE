import { UserInfo } from "./user.info";

export interface TokenPayload extends UserInfo {
    iat?: number;
    exp?: number;
}