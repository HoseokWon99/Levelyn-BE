import { ModelBase } from "./model.base";
import { ModelDTOMapper, ModelToDTO } from "./model.dto.mapper";
import { ModelConstructor } from "./model.constructor";

export interface IModelHandler<
    M extends ModelBase<ModelBase.DTOType<M>>
> {
    readonly modelToDTO: ModelToDTO<M>;
}

export type ModelHandlerConstructor<M extends ModelBase<ModelBase.DTOType<M>>>
    = { new (...args: any[]): IModelHandler<M> };

export function ModelHandler<
    M extends ModelBase<ModelBase.DTOType<M>>
>(Model: ModelConstructor<M>): ModelHandlerConstructor<M> {
    return class {
        readonly modelToDTO: ModelToDTO<M> = ModelDTOMapper(Model);
    }
}