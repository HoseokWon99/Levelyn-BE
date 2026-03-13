import { AsyncContext, IEventPublisher } from "@nestjs/cqrs";
import { UserEvent } from "../user.event";

export class UserEventPublisher implements IEventPublisher<UserEvent> {
    publish<TEvent extends UserEvent>(
        event: TEvent,
        dispatcherContext?: unknown,
        asyncContext?: AsyncContext,
    ): any {

    }

    publishAll<TEvent extends UserEvent>(events: TEvent[], dispatcherContext?: unknown, asyncContext?: AsyncContext): any {
    }
}