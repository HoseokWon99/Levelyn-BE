import { TypeDTO } from "../../common";

export interface ItemDTO {
    id: number;
    type: TypeDTO;
    name: string;
    description: string;
}