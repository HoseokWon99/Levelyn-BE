import { ModelBase } from "./model.base";
import { ModelConstructor } from "./model.constructor";
import { plainToInstance } from "class-transformer";

export type ModelToDTO<M extends ModelBase<ModelBase.DTOType<M>>>
    = (m: M) => ModelBase.DTOType<M>;

export function ModelDTOMapper<
    M extends ModelBase<ModelBase.DTOType<M>>
>(Model: ModelConstructor<M>): ModelToDTO<M> {
    return function (model: M): ModelBase.DTOType<M> {
        return plainToInstance(Model, model).toDTO();
    }
}