import { Inject, Injectable, Logger } from "@nestjs/common";
import { Random } from "random";
import { ItemRangesService } from "./item.ranges.service";
import { pipe, find, prop } from "@fxts/core";


@Injectable()
export class RandomItemService {
    private readonly _logger: Logger = new Logger(RandomItemService.name);

    constructor(
        @Inject(ItemRangesService)
        private readonly _rangesService: ItemRangesService,
        @Inject(Random)
        private readonly _random: Random
    ) {}

    async pickItem(): Promise<number> {
        const ranges = await this._rangesService.loadItemRanges();

        return pipe(
            this._random.float(0, ranges.at(-1)!.upper),
            x => find(({ upper }) => x < upper, ranges)!,
            prop("itemId")
        );
    }


}

