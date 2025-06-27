import { Inject, Injectable, Logger } from "@nestjs/common";
import { WalletsService } from "./service/wallets.service";
import { OnEvent } from "@nestjs/event-emitter";
import { FulfillToDoEvent } from "../to-do/dto";

@Injectable()
export class WalletsListener {
    private readonly _logger: Logger = new Logger(WalletsListener.name);

    constructor(
        @Inject(WalletsService)
        private readonly _walletsService: WalletsService,
    ) {}

    @OnEvent("fulfill.to-do")
    async onFulfillToDo(msg: FulfillToDoEvent): Promise<void> {
        const { walletId: id, coin: deltaCoin } = msg;

        deltaCoin && await this._walletsService
            .updateCoin({ id, deltaCoin })
            .catch(err => this._logger.error(err));
    }
}