import {Body, Controller, Delete, Get, HttpCode, Inject, Logger, Param, Patch, Post, Put, Query, UseGuards} from "@nestjs/common";
import { ToDoService } from "../service";
import { JwtAuthGuard } from "../../auth";
import { User } from "../../common";
import { CreateToDoBody, GetDailyToDoListQuery, UpdateToDoBody } from "../dto";
import { UserInfo } from "../../auth/dto";

@Controller("/api/to-do")
@UseGuards(JwtAuthGuard)
export class ToDoController {
    private readonly _logger: Logger = new Logger(ToDoController.name);

    constructor(
        @Inject(ToDoService)
        private readonly _toDoService: ToDoService,
    ) {}

    @Post("/")
    async createToDo(
        @User("id") userId: number,
        @Body() body: CreateToDoBody
    ) {
        await this._toDoService.createToDo({ userId, ...body });
    }

    @Get("/")
    async getDailyToDoList(
        @User("id") userId: number,
        @Query() query: GetDailyToDoListQuery
    ) {
       const results = await this._toDoService.getDailyToDoList({ userId, ...query });
       return { results };
    }

    @Patch("/:id")
    @HttpCode(205)
    async updateToDo(
        @Param("id") id: number,
        @User("id") userId: number,
        @Body() body: UpdateToDoBody
    ) {
        await this._toDoService.updateToDo({ id, userId, ...body });
    }

    @Delete("/:id")
    @HttpCode(204)
    async deleteToDo(
        @Param("id") id: number,
        @User("id") userId: number
    ) {
        await this._toDoService.deleteToDo({ id, userId });
    }

    @Put("/:id")
    @HttpCode(205)
    async fulfillToDo(
        @Param("id") id: number,
        @User() user: UserInfo
    ) {
        await this._toDoService.fulfilToDo({ id, userId: user.id });
    }
}