export interface GetPlayerItemsDTO {
    playerId: number;
    equipped?: boolean;
    itemIds?: number[];
    typeIds?: number[];
}