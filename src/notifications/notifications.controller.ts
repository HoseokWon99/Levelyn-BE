import { Controller, Inject, Query, Sse, UseGuards, UseInterceptors } from '@nestjs/common';
import { SseJwtAuthGuard } from "../auth";
import { AuthQuerySchema, SseInterceptor, User, SseResponse } from "../common";
import { interval, map, merge, Observable } from "rxjs";
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { Notification } from "./notification";
import { NotificationsService } from "./notifications.service";
import { SSE_HEARTBEAT_PERIOD } from "./token";
const pingResponse = new Notification("", "ping", null);

@ApiTags("Notifications")
@Controller('/api/notifications')
@UseGuards(SseJwtAuthGuard)
export class NotificationsController {
    private readonly _heartbeat$: Observable<Notification>;

    constructor(
        @Inject(NotificationsService)
        private readonly _notificationsService: NotificationsService,
        @Inject(SSE_HEARTBEAT_PERIOD)
        heartbeatPeriod: number
    ) {
        this._heartbeat$ = interval(heartbeatPeriod)
            .pipe(map(() => pingResponse));
    }

    @Sse("/")
    @ApiOperation({ summary: "sse endpoint" })
    @ApiQuery({ type: AuthQuerySchema, required: true })
    @ApiQuery({ name: "lastId", required: false, description: "Last received stream ID for catch-up" })
    @ApiOkResponse({ type: SseResponse })
    @UseInterceptors(SseInterceptor)
    notifyUser(
        @User("id") userId: number,
        @Query("lastId") lastId?: string,
    ): Observable<Notification> {
        return merge(
            this._notificationsService.getUserNotifications(userId, lastId),
            this._heartbeat$,
        );
    }
}


