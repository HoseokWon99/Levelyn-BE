export interface FulfillToDoEvent {
    userId: number;
    stateId: number;
    walletId: number;
    exp: number;
    itemId?: number;
    coin?: number;
    sessionId: string | null;
}