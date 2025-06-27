import { ItemDTO } from "../../../game/items/dto";
import { PlayerOwningDTO } from "../player.owning.dto";

export type PlayerItemDTO = PlayerOwningDTO<ItemDTO>;