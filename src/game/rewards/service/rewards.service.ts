import { Inject, Injectable } from "@nestjs/common";
import { BATTLE_EXP_REWARD, TILE_EXP_REWARD } from "../../system";
import { RewardDTO, RewardFor } from "../dto";
import { RandomBoxesService } from "./random-boxes.service";

@Injectable()
export class RewardsService {
    private readonly _expRewards: Record<RewardFor, number>

    constructor(
        @Inject(TILE_EXP_REWARD) tileExp: number,
        @Inject(BATTLE_EXP_REWARD) battleExp: number,
        @Inject(RandomBoxesService)
        private readonly _randomBoxesService: RandomBoxesService
    ) {
        this._expRewards = { tile: tileExp, battle: battleExp };
    }

    async getReward(rewardFor: RewardFor): Promise<RewardDTO> {
        const exp = this._expRewards[rewardFor];
        const randomBox = await this._randomBoxesService.getRandomBox();
        return { exp, ...randomBox };
    }
}