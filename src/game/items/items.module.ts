import { Module } from '@nestjs/common';
import { TypeOrmModule } from "@nestjs/typeorm";
import { Item, ItemType, ItemRange } from "./model";
import { ItemRangesService, ItemsService, RandomItemService } from './service';

@Module({
    imports: [TypeOrmModule.forFeature([Item, ItemType, ItemRange])],
    providers: [
        ItemsService,
        ItemRangesService,
        RandomItemService
    ],
    exports: [ItemsService, ItemRangesService, RandomItemService],
})
export class ItemsModule {}
