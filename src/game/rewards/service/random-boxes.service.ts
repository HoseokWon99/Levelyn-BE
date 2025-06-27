import { Inject, Injectable, Logger } from '@nestjs/common';
import { RandomBoxDTO } from "../dto";
import { IS_ITEM_REWARD, RANDOM_COIN_GENERATOR } from "../token";
import { RandomItemService } from "../../items";

@Injectable()
export class RandomBoxesService {
    private readonly _logger: Logger = new Logger(RandomBoxesService.name);

    constructor(
      @Inject(IS_ITEM_REWARD)
      private readonly _isItemReward: () => number,
      @Inject(RANDOM_COIN_GENERATOR)
      private readonly _coinGenerator: () => number,
      @Inject(RandomItemService)
      private readonly _randomItemService: RandomItemService
    ) {}


    async getRandomBox(): Promise<RandomBoxDTO> {
        return this._isItemReward()
            ? { itemId: await this._randomItemService.pickItem() }
            : { coin: this._coinGenerator() };
    }
}



