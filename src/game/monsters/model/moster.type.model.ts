import { Entity } from "typeorm";
import { ModelBase } from "../../../common";
import { TypeBase } from "../../common";

@Entity("monster_types")
export class MonsterType extends TypeBase {}