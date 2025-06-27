import { RandomItemService } from "./random.item.service";
import { ItemRangesService } from "./item.ranges.service";
import { Random } from "random";
import { Test, TestingModule } from "@nestjs/testing";

describe("RandomItemService", () => {
    let service: RandomItemService;
    let rangesService: ItemRangesService;
    let random: Random;

    beforeEach(async () => {

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RandomItemService,
                {
                    provide: ItemRangesService,
                    useValue: { loadItemRanges: jest.fn() }
                },
                {
                    provide: Random,
                    useValue: { float: jest.fn() }
                }
            ]
        }).compile();

        service = module.get<RandomItemService>(RandomItemService);
        rangesService = module.get<ItemRangesService>(ItemRangesService);
        random = module.get<Random>(Random);
    });

    describe("pickItem", () => {

        const ranges = [
            { upper: 10, itemId: 1 },
            { upper: 30, itemId: 2 },
            { upper: 60, itemId: 3 },
        ];

        let idx = 0;

        beforeEach(() => {
            (rangesService.loadItemRanges as jest.Mock).mockResolvedValue(ranges);
        });

        it.each(
            [5, 20, 45]
        )(
            "Pick an item based on random value within ranges and returns its itemId",
            async (w) => {
                (random.float as jest.Mock).mockReturnValue(w);
                await expect(service.pickItem()).resolves.toBe(ranges[idx++].itemId);
            }
        );

    });
});
