import { Test, TestingModule } from '@nestjs/testing';
import { ToDoService } from './to-do.service';
import { GoalsService } from './goals.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ToDo } from '../model';

jest.mock('typeorm-transactional', () => ({
    Transactional: () => () => ({}),
}));

describe('ToDoService', () => {
    let service: ToDoService;
    let toDoRepository: Repository<ToDo>;
    let goalsService: GoalsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ToDoService,
                {
                    provide: getRepositoryToken(ToDo),
                    useClass: Repository,
                },
                {
                    provide: GoalsService,
                    useValue: { onUpsertSubToDo: jest.fn() },
                }
            ],
        }).compile();

        service = module.get<ToDoService>(ToDoService);
        toDoRepository = module.get<Repository<ToDo>>(getRepositoryToken(ToDo));
        goalsService = module.get<GoalsService>(GoalsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createToDo', () => {
        it('should save to-do and call goalsService if isSub', async () => {
            const dto: any = { isSub: true, userId: 1, toDTO: jest.fn() };
            jest.spyOn(toDoRepository, 'save').mockResolvedValue(dto);
            await service.createToDo(dto);
            expect(toDoRepository.save).toHaveBeenCalledWith(dto);
            expect(goalsService.onUpsertSubToDo).toHaveBeenCalledWith(dto.userId, dto.toDTO());
        });
    });

    describe('getDailyToDoList', () => {
        it('should return filtered to-do list', async () => {
            const toDo = { toDTO: jest.fn().mockReturnValue({ date: new Date(), completed: false }) };
            jest.spyOn(toDoRepository, 'findBy').mockResolvedValue([toDo as unknown as ToDo]);
            const result = await service.getDailyToDoList({ userId: 1, date: new Date() });
            expect(result).toBeInstanceOf(Array);
        });
    });

    describe('updateToDo', () => {
        it('should update to-do and call goalsService if isSub', async () => {
            const dto: any = { id: 1, userId: 1, isSub: true };
            const foundToDo: any = { isSub: false, userId: 1, toDTO: jest.fn() };
            jest.spyOn(toDoRepository, 'findOneBy').mockResolvedValue(foundToDo);
            jest.spyOn(toDoRepository, 'update').mockResolvedValue({} as any);
            await service.updateToDo(dto);
            expect(goalsService.onUpsertSubToDo).toHaveBeenCalled();
            expect(toDoRepository.update).toHaveBeenCalled();
        });
    });

    describe('deleteToDo', () => {
        it('should delete to-do', async () => {
            jest.spyOn(toDoRepository, 'delete').mockResolvedValue({} as any);
            await service.deleteToDo({ id: 1, userId: 1 });
            expect(toDoRepository.delete).toHaveBeenCalled();
        });
    });

    describe('onGoalDeleted', () => {
        it('should update to-dos to set isSub to false', async () => {
            jest.spyOn(toDoRepository, 'update').mockResolvedValue({} as any);
            await service.onGoalDeleted(1);
            expect(toDoRepository.update).toHaveBeenCalledWith(1, { isSub: false });
        });
    });
});
