import { Module } from '@nestjs/common';
import { TypeOrmModule } from "@nestjs/typeorm";
import { Goal, ToDo, ToDoPeriod } from "./model";
import { AuthModule, JwtAuthGuard } from "../auth";
import { GoalsService, ToDoService } from "./service";
import { GoalsController, ToDoController } from "./controller";

const EXTERNAL_PROVIDERS = [JwtAuthGuard];

@Module({
    imports: [
        TypeOrmModule.forFeature([ToDo, ToDoPeriod, Goal]),
        AuthModule,
    ],
    providers: [
        ...EXTERNAL_PROVIDERS,
        ToDoService,
        GoalsService
    ],
    controllers: [ToDoController, GoalsController],
})
export class ToDoModule {}
