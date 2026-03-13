import { IsBoolean, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";
import { IsNotPast } from "../../../../common";
import { ApiExtraModels, ApiProperty } from "@nestjs/swagger";
import { ToDoPeriodSchema } from "./schema";
import { Transform, Type } from "class-transformer";
import { Logger } from "@nestjs/common";

@ApiExtraModels(ToDoPeriodSchema)
export class CreateToDoBody {
    @ApiProperty({ type: "string", description: "할 일 내용", required: true })
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiProperty({ type: Date, description: "실행일", required: true })
    @IsNotPast()
    @Transform(({ value }) => {
        Logger.debug(value, CreateToDoBody.name);
        return new Date(value);
    })
    date: Date;

    @ApiProperty({ type: "boolean", description: "하위 할 일 여부", required: false })
    @IsOptional()
    @IsBoolean()
    isSub?: boolean;

    @ApiProperty({ type: ToDoPeriodSchema, description: "반복 주기", required: false })
    @IsOptional()
    @ValidateNested()
    @Type(() => ToDoPeriodSchema)
    period?: ToDoPeriodSchema;
}