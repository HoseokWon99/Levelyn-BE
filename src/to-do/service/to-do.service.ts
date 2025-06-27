import { ConflictException, forwardRef, Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ToDo } from "../model";
import { LessThanOrEqual, Repository } from "typeorm";
import { CreateToDoDTO, GetToDoDTO, GetDailyToDoListDTO, UpdateToDoDTO, ToDoDTO } from "../dto";
import { filter, isNull, map, omit, pipe, throwIf, toArray } from "@fxts/core";
import { add } from "date-fns";
import { Transactional } from "typeorm-transactional";
import { isDayToDo } from "./service.internal";
import { GoalsService } from "./goals.service";
import { ModelHandler } from "../../common";

@Injectable()
export class ToDoService extends ModelHandler(ToDo) {
    private readonly _logger: Logger = new Logger(ToDoService.name);

    constructor(
       @InjectRepository(ToDo)
       private readonly _toDoRepos: Repository<ToDo>,
       @Inject(forwardRef(() => GoalsService))
       private readonly _goalsService: GoalsService
    ) { super(); }

    @Transactional()
    async createToDo(dto: CreateToDoDTO): Promise<void> {
        const toDo = await this._toDoRepos.save(dto);
        toDo.isSub && await this._goalsService.onUpsertSubToDo(toDo.userId, toDo.toDTO());
    }

    async getDailyToDoList(dto: GetDailyToDoListDTO): Promise<ToDoDTO[]> {
        const { userId, date } = dto;

        return pipe(
            await this._toDoRepos.findBy({ userId, date: LessThanOrEqual(date) }),
            map(toDo => this.modelToDTO(toDo)),
            filter(toDo => isDayToDo(date, toDo)),
            toArray
        );
    }

    @Transactional()
    async updateToDo(dto: UpdateToDoDTO): Promise<void> {
        const { id, userId, ...values } = dto;

        values.isSub && await pipe(
            await this._toDoRepos.findOneBy({ id, userId }),
            throwIf(isNull, () => new NotFoundException()),
            async toDo => toDo.isSub || await this._goalsService.onUpsertSubToDo(toDo.userId, toDo.toDTO())
        );

        await this._toDoRepos.update({ id, userId }, values);
    }

    async deleteToDo(dto: GetToDoDTO): Promise<void> {
        await this._toDoRepos.delete(dto);
    }

    @Transactional()
    async fulfilToDo(dto: GetToDoDTO): Promise<void> {
        const { id, userId } = dto;
        const today = new Date();

        const toDo = pipe(
            await this._toDoRepos.findOneBy({ id, userId }),
            throwIf(isNull, () => new NotFoundException()),
            toDo => this.modelToDTO(toDo),
            throwIf(
                toDo => !isDayToDo(today, toDo) || toDo.completed,
                () => new ConflictException()
            )
        );

        toDo.period && await this._toDoRepos.save({
            date: add(today, { [toDo.period.unit]: toDo.period.amount }),
            ...omit(["id", "date"], toDo)
        });

        await this._toDoRepos.update(id, { completed: true });
    }

    @Transactional()
    async onGoalDeleted(userId: number): Promise<void> {
        await this._toDoRepos.update(userId, { isSub: false });
    }
}

