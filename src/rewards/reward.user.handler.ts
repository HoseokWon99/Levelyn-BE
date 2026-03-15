import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { RewardUserCommand } from "./reward.user.command";
import { Inject, Logger } from "@nestjs/common";
import { RewardsService } from "./service";
import { UserEvent } from "../common";

@CommandHandler(RewardUserCommand)
export class RewardUserHandler implements ICommandHandler<RewardUserCommand> {
    private readonly _logger: Logger = new Logger(RewardUserHandler.name);

    constructor(
       @Inject(RewardsService)
       private readonly _rewardsService: RewardsService,
       @Inject(EventBus)
       private readonly _eventBus: EventBus,
    ) {}

    async execute(cmd: RewardUserCommand): Promise<void> {
        await this._rewardsService.rewardUser(cmd)
            .then(result => {

                this._eventBus.publish(
                    new UserEvent(cmd.userId, "REWARD", result)
                );

                this._logger.log(`event published: ${result}`);
            })
            .catch(err => { this._logger.error(err); });
    }
}