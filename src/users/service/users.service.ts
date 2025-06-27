import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../model";
import { UpsertUserDTO, UserDTO } from "../dto";
import { ModelHandler } from "../../common";

@Injectable()
export class UsersService extends ModelHandler(User) {
    private readonly _logger: Logger = new Logger(UsersService.name);

    constructor(
        @InjectRepository(User)
        private readonly _usersRepos: Repository<User>
    ) { super(); }

    async upsertUser(dto: UpsertUserDTO): Promise<UserDTO> {
        return await this.getOrCreateUser(dto)
            .catch(err => {
                this._logger.error(err);
                throw err;
            });
    }

    private async getOrCreateUser(dto: UpsertUserDTO): Promise<User> {
        const user = await this._usersRepos.findOneBy({ openId: dto.openId });
        return user ?? await this._usersRepos.save({ ...dto, player: {}, wallet: {} });
    }
}


