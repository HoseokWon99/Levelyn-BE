import { ModelBase } from "./model.base";

export type ModelConstructor<
    M extends ModelBase<ModelBase.DTOType<M>>
> = { new (): M; };