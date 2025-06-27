import { Body, Controller, Get, HttpCode, Inject, Put, UseGuards } from "@nestjs/common";
import { PlayerSkillsService } from "../service";
import { SkillsService } from "../../game";
import { JwtAuthGuard } from "../../auth";
import { User } from "../../common";
import { GetPlayerSkillsResponse, UpdateSkillsSlotBody } from "../dto";

@Controller("/api/inventory/skills")
@UseGuards(JwtAuthGuard)
export class PlayerSkillsController {

    constructor(
       @Inject(SkillsService)
       private readonly _skillsService: SkillsService,
       @Inject(PlayerSkillsService)
       private _playerSkillsService: PlayerSkillsService
    ) {}

    @Get("/")
    async getPlayerSkills(@User("id") playerId: number): Promise<GetPlayerSkillsResponse> {
        const skills = await this._skillsService.getAllSkills();
        const playerSkills = await this._playerSkillsService.getPlayerSkills(playerId);
        return { skills, playerSkills };
    }

    @Put("/slot")
    @HttpCode(205)
    async updateSlot(
        @User("id") playerId: number,
        @Body() { skillIds }: UpdateSkillsSlotBody
    ): Promise<void> {
        await this._playerSkillsService.updateEquipped({ playerId, skillIds });
    }
}