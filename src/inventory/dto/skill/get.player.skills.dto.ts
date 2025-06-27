export interface GetPlayerSkillsDTO {
    playerId: number;
    skillIds?: number[];
    equipped?: boolean;
}