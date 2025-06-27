import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from "express";

export function ParamDecorator(prop: string) {
    return createParamDecorator((data: string, ctx: ExecutionContext) => {
        const req = ctx.switchToHttp().getRequest<Request>();
        const tg = req[prop];
        return data ? tg?.[data] : tg;
    });
}

export const User = ParamDecorator("user");
export const Cookies = ParamDecorator("cookies");



