import { Injectable, Logger } from "@nestjs/common";
import { Repository } from "typeorm";
import { ItemRange } from "../model";
import { InjectRepository } from "@nestjs/typeorm";
import { ItemRangeDTO } from "../dto";
import { map, pipe, toArray } from "@fxts/core";

@Injectable()
export class ItemRangesService {
    private readonly _logger: Logger = new Logger(ItemRangesService.name);

    constructor(
        @InjectRepository(ItemRange)
        private readonly _itemRangesRepos: Repository<ItemRange>
    ) {}

    async loadItemRanges(): Promise<ItemRangeDTO[]> {
        return pipe(
            await this._itemRangesRepos.find({ cache: true }),
            map(ir => ir.toDTO()),
            toArray
        );
    }
}