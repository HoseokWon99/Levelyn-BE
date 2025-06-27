import { TypeDTO } from "../../common";

export interface MonsterDTO {
    id: number;
    type: TypeDTO;
    name: string;
    hp: number;
}