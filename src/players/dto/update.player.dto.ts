import { PlayerDTO } from "./player.dto";

export type UpdatePlayerDTO
    = { id: number; } & Partial<Omit<PlayerDTO, "id">>;