import { SkillRequirementDTO } from "./skill.requirement.dto";

type __MappedType<T> = {
    [P in keyof T]?: T[P] | [T[P], T[P]];
};

export type GetSKillsDTO = __MappedType<SkillRequirementDTO>;