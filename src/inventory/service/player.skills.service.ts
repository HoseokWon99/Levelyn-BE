import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PlayerSkill } from "../model";
import { FindOptionsWhere, In, Repository } from "typeorm";
import { Transactional } from "typeorm-transactional";
import { EquippedSkillDTO, GetPlayerSkillsDTO, UpsertPlayerSkillsDTO, PlayerSkillDTO } from "../dto";
import { concat, difference, identity, map, pipe, prop, throwError, throwIf, toArray, toAsync } from "@fxts/core";
import { ModelHandler } from "../../common";

@Injectable()
export class PlayerSkillsService extends ModelHandler(PlayerSkill) {
    private readonly _logger: Logger = new Logger(PlayerSkillsService.name);

    constructor(
        @InjectRepository(PlayerSkill)
        private readonly _playerSkillsRepos: Repository<PlayerSkill>
    ) { super(); }

    @Transactional()
    async addPlayerSkills(dto: UpsertPlayerSkillsDTO): Promise<PlayerSkillDTO[]> {
        const { playerId, skillIds } = dto;

        const playerSkills: PlayerSkill[] = await this._playerSkillsRepos.save(
            skillIds.map(skillId => ({ playerId: playerId, skillId }))
        );

        return playerSkills.map(ps => this.modelToDTO(ps));
    }

    async getPlayerSkills(playerId: number): Promise<PlayerSkillDTO[]> {
       const playerSkills = await this.getPlayerSkillsBy({ playerId });
       return playerSkills.map(ps => this.modelToDTO(ps));
    }

    async getEquippedSkills(userId: number): Promise<EquippedSkillDTO[]> {
        return pipe(
            await this.getPlayerSkillsBy({ playerId: userId, equipped: true }),
            map(async ({ skill }) => {
                const effect = await skill.effect;
                return { ...skill.toDTO(), ...effect.toDTO() } as EquippedSkillDTO;
            }),
            toAsync,
            toArray
        );
    }

    @Transactional()
    async updateEquipped(dto: UpsertPlayerSkillsDTO): Promise<void> {
        const { playerId } = dto;

        const oldIds = pipe(
            await this.getPlayerSkillsBy({ playerId: playerId, equipped: true }),
            map(prop("id")),
            toArray
        );

        const newIds =  pipe(
            await this.getPlayerSkillsBy(dto),
            map(prop("id")),
            toArray
        );

        const ids = pipe(
            difference(newIds, oldIds),
            concat(difference(oldIds, newIds)),
            toArray
        );


        await this._playerSkillsRepos.update(ids, { equipped: () => '!equipped' })
            .then(throwIf(
                ({ affected }) => affected! !== ids.length,
                () => Error("Query failed")
            )).catch(throwError(identity));
    }

    private getPlayerSkillsBy(dto: GetPlayerSkillsDTO): Promise<PlayerSkill[]> {
        return pipe(
            __makeWhereOptions(dto),
            where => this._playerSkillsRepos.findBy(where)
        )
    }
}

function __makeWhereOptions(dto: GetPlayerSkillsDTO): FindOptionsWhere<PlayerSkill> {
    const { skillIds, ...rest } = dto;
    return skillIds ? { ...rest, skillId: In(skillIds) } : rest;
}



