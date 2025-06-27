import { Entity } from "typeorm";
import { TypeBase } from "../../common";

@Entity("item_types")
export class ItemType extends TypeBase {}