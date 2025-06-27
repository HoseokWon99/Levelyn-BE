import { Injectable } from '@nestjs/common';
import { Repository } from "typeorm";
import { Item } from "../model";
import { InjectRepository } from "@nestjs/typeorm";
import { ItemDTO } from "../dto";
import { ModelHandler } from "../../../common";

@Injectable()
export class ItemsService extends ModelHandler(Item) {

    constructor(
        @InjectRepository(Item)
        private readonly _itemsRepos: Repository<Item>
    ) { super(); }

    async getAllItems(): Promise<ItemDTO[]> {
        const items = await this._itemsRepos.find({ cache: true });
        return items.map(item => this.modelToDTO(item));
    }

}
