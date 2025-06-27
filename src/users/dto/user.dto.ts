import { PlayerDTO } from "../../players/dto";
import { WalletDTO } from "../../wallets/dto";


export interface UserDTO {
    id: number;
    openId: string;
    name: string;
    player: PlayerDTO;
    wallet: WalletDTO;
}