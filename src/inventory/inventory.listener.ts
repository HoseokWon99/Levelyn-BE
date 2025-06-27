import { Inject, Injectable, Logger } from "@nestjs/common";
import { PlayerItemsService } from "./service";
import { OnEvent } from "@nestjs/event-emitter";
import { FulfillToDoEvent } from "../to-do/dto";

@Injectable()
export class InventoryListener {
    private readonly _logger: Logger = new Logger(InventoryListener.name);

    constructor(
        @Inject(PlayerItemsService)
        private readonly _userItemsService: PlayerItemsService
    ) {}

    @OnEvent("fulfill.to-do")
    async onFulfillToDo(msg: FulfillToDoEvent): Promise<void> {
        const { userId, itemId } = msg;

        itemId && await this._userItemsService.addPlayerItems({
            playerId: userId,
            itemIds: [itemId]
        }).catch(err => this._logger.error(err));
    }
}