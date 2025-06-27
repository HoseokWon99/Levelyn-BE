import { RewardDTO } from "../../../game/rewards/dto";

export interface FulfillToDoResult {
    isBattle: boolean;
    sessionId: string | null;
    reward: RewardDTO
}