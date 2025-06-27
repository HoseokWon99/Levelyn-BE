import { Test, TestingModule } from "@nestjs/testing";
import { YamlConfigService } from "./yaml-config.service";
import { ConfigField, ConfigSchema, NestedField } from "./decorator";
import { ConfigService } from "@nestjs/config";

class PlayerRecord {
    @ConfigField()
    win: number;
    @ConfigField()
    draw: number;
    @ConfigField()
    defeat: number;
}

@ConfigSchema("player")
class Player {
    @ConfigField()
    nickname: string;

    @ConfigField({ path: "is_locked" })
    isLocked: boolean;

    @NestedField(() => PlayerRecord)
    @ConfigField()
    record: PlayerRecord;
}

describe("YamlConfigService", () => {
    let service: YamlConfigService;

    const mockConfig = {
        'player.nickname': 'foo',
        'player.is_locked': false,
        'player.record.win': 100,
        'player.record.draw': 20,
        'player.record.defeat': 10
    };

    beforeEach(async () => {

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                YamlConfigService,
                {
                    provide: ConfigService,
                    useValue: { get: jest.fn((key: string): any => {
                            return mockConfig[key];
                        }) },
                }
            ]
        }).compile();

        service = module.get(YamlConfigService);
    });

    it ("Load config based on schema", () => {
        expect(service.loadYamlConfig(Player)).toEqual({
            nickname: 'foo',
            isLocked: false,
            record: { win: 100, draw: 20, defeat: 10 }
        });
    })

})