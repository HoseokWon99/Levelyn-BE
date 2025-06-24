import { Body, Controller, Get, HttpCode, Inject, Patch, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../auth";
import { PlayerItemsService } from "../service";
import { User } from "../../common";
import { UpdateItemsSlotBody, GetPlayerItemsResponse } from "../dto";

@Controller("/api/inventory/items")
@UseGuards(JwtAuthGuard)
export class PlayerItemsController {

    constructor(
       @Inject(PlayerItemsService)
       private readonly _playerItemsService: PlayerItemsService
    ) {}

    @Get("/")
    async getUserItems(@User("id") userId: number): Promise<GetPlayerItemsResponse> {
        const results = await this._playerItemsService.getPlayerItems(userId);
        return { results };
    }

    @Patch("/slot")
    @HttpCode(205)
    async updateSlot(
        @User("playerId") playerId: number,
        @Body() { itemIds }: UpdateItemsSlotBody
    ): Promise<void> {
        await this._playerItemsService.updateEquipped({ playerId, itemIds });
    }
}