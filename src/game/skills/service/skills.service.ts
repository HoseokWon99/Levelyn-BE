import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Skill } from "../model";
import { Between, FindOperator, FindOptionsWhere, LessThanOrEqual, Repository } from "typeorm";
import { GetSKillsDTO, SkillDTO } from "../dto";
import { compactObject, entries, fromEntries, isNumber, map, pipe, toArray } from "@fxts/core";
import { ModelHandler } from "../../../common";

@Injectable()
export class SkillsService extends ModelHandler(Skill) {
    private readonly _logger: Logger = new Logger(SkillsService.name);

    constructor(
       @InjectRepository(Skill)
       private readonly _skillsRepository: Repository<Skill>,
    ) { super(); }

    async getAllSkills(): Promise<SkillDTO[]> {
        const skills = await this._skillsRepository.find({ cache: true });
        return skills.map(skill => this.modelToDTO(skill));
    }

    getSkillsBy(dto: GetSKillsDTO): Promise<SkillDTO[]> {
        return pipe(
            __makeWhereOptions(dto),
            where => this._skillsRepository.findBy(where),
            map(skill => this.modelToDTO(skill)),
            toArray
        );
    }
}

function __makeWhereOptions(dto: GetSKillsDTO): FindOptionsWhere<Skill> {
    return pipe(
        compactObject(dto),
        entries,
        map(([k, v]): [keyof GetSKillsDTO, FindOperator<number>] =>{
            return [k, isNumber(v) ? LessThanOrEqual(v!) : Between(...v!)];
        }),
        fromEntries,
        requirement => ({ requirement })
    );
}