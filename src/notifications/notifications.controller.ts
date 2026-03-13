import { Controller, Inject, Sse, UseGuards, UseInterceptors } from '@nestjs/common';
import { SseJwtAuthGuard } from "../auth";
import { AuthQuerySchema, SseInterceptor, User } from "../common";
import { interval, map, merge, Observable } from "rxjs";
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { NotificationSchema } from "./api";
import { NotificationsService } from "./service";
import { UserNotification } from "./notification";
import { SSE_HEARTBEAT_PERIOD } from "./token";
import { NotificationsInterceptor } from "./notifications.interceptor";
import { SseMonitoringInterceptor } from "../monitoring";

@ApiTags("Notifications")
@Controller('/api/notifications')
@UseGuards(SseJwtAuthGuard)
export class NotificationsController {

    constructor(
        @Inject(NotificationsService)
        private readonly _notificationsService: NotificationsService,
        @Inject(SSE_HEARTBEAT_PERIOD)
        private readonly _heartbeatPeriod: number
    ) {}

    @Sse("/")
    @ApiOperation({ summary: "sse endpoint" })
    @ApiQuery({ type: AuthQuerySchema, required: true })
    @ApiOkResponse({ type: NotificationSchema })
    @UseInterceptors(SseInterceptor, NotificationsInterceptor, SseMonitoringInterceptor)
    notifyUser(@User("id") userId: number): Observable<NotificationSchema> {

        const heartbeat$ = interval(this._heartbeatPeriod)
            .pipe(
                map(() => new UserNotification("ping", null))
            );

        const notification$ = this._notificationsService
            .getUserNotifications(userId);

        return merge(notification$, heartbeat$);
    }
}


