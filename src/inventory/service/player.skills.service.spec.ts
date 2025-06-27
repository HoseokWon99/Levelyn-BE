import { Test, TestingModule } from '@nestjs/testing';
import { PlayerSkillsService } from './player.skills.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSkill } from '../model';
import { UpsertPlayerSkillsDTO, PlayerSkillDTO } from '../dto';
import random from "random";

jest.mock('typeorm-transactional', () => ({
    Transactional: () => () => ({}),
}));

const mockRepository = () => ({
    save: jest.fn(),
    findBy: jest.fn(),
    update: jest.fn(),
});

const userSkillEntity = (overrides = {}) => Object.assign({
    id: random.int(1),
    equipped: false,
    toDTO(): PlayerSkillDTO {
        return {
            id: this.skillId,
            equipped: this.equipped
        } as PlayerSkillDTO;
    }
}, overrides) as UserSkill;

describe('UserSkillsService', () => {
    let service: PlayerSkillsService;
    let repo: Repository<UserSkill>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PlayerSkillsService,
                {
                    provide: getRepositoryToken(UserSkill),
                    useFactory: mockRepository,
                },
            ],
        }).compile();

        service = module.get<PlayerSkillsService>(PlayerSkillsService);
        repo = module.get<Repository<UserSkill>>(getRepositoryToken(UserSkill));
    });

    describe('addUserSkills', () => {
        it('should save user skills and return DTOs', async () => {
            const userId = 1;
            const skillIds = [101, 102];

            const saved = skillIds.map(skillId => userSkillEntity({ skillId }));
            (repo.save as jest.Mock).mockResolvedValue(saved);

            const results = await service.addPlayerSkills({ playerId: userId, skillIds });
            expect(results).toHaveLength(2);

            for (let i = 0; i !== skillIds.length; ++i)
                expect(results[i].id).toBe(skillIds[i]);
        });
    });

    describe('updateEquipped', () => {

        it('should toggle equipped status based on skill differences', async () => {
            const dto: UpsertPlayerSkillsDTO = { playerId: 1, skillIds: [1, 2] };

            const oldSkills = [
                userSkillEntity({ id: 1, equipped: true }),
                userSkillEntity({ id: 3, equipped: true }),
            ];

            const newSkills = [
                userSkillEntity({ id: 1, equipped: true }),
                userSkillEntity({ id: 2, equipped: false }),
            ];



            (repo.findBy as jest.Mock)
                .mockResolvedValueOnce(oldSkills)
                .mockResolvedValueOnce(newSkills);

            (repo.update as jest.Mock).mockResolvedValue({ affected: 2 });

            await expect(service.updateEquipped(dto)).resolves.toBeUndefined();
            expect(repo.update).toHaveBeenCalledWith([2, 3],{ equipped: expect.any(Function) });
        });

        it('should throw error if update affects incorrect number of rows', async () => {
            const dto: UpsertPlayerSkillsDTO = { playerId: 1, skillIds: [1] };
            const oldSkills = [userSkillEntity({ id: 1 })];
            const newSkills = [userSkillEntity({ id: 2 })];

            (repo.findBy as jest.Mock)
                .mockResolvedValueOnce(oldSkills)
                .mockResolvedValueOnce(newSkills);

            (repo.update as jest.Mock).mockResolvedValue({ affected: 0 });

            await expect(service.updateEquipped(dto)).rejects.toThrow('Query failed');
        });
    });
});
