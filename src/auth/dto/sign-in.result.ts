import { PlayerDTO } from "../../players/dto";
import { WalletDTO } from "../../wallets/dto";


export interface SignInResult {
    accessToken: string;
    refreshToken: string;
    player: PlayerDTO;
    wallet: WalletDTO;
}