import { EventsHandler, IEventHandler } from "@nestjs/cqrs";
import { UserEvent } from "../common";
import { Inject, Logger } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";

@EventsHandler(UserEvent)
export class UserEventHandler implements IEventHandler<UserEvent> {
    private readonly _logger: Logger = new Logger(UserEventHandler.name);

    constructor(
       @Inject(NotificationsService)
       private readonly _notificationsService: NotificationsService,
    ) {}

    async handle(event: UserEvent): Promise<void> {
        this._logger.debug(event);

        await this._notificationsService.addUserEvent(event)
            .catch(err => this._logger.error(err));
    }
}