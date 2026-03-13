import { Module } from "@nestjs/common";
import { NotificationsController } from './notifications.controller';
import { AuthModule, SseJwtAuthGuard } from "../auth";
import { NotificationsService } from "./notifications.service";
import { UserEventHandler } from "./user.event.handler";
import { OptionsProvider } from "../common";
import { NOTIFICATION_BLOCK_TIMEOUT, NOTIFICATION_LOOP_DELAY, SSE_HEARTBEAT_PERIOD, STREAM_MAX_LENGTH } from "./token";

const EXTERNAL_PROVIDERS = [SseJwtAuthGuard]

@Module({
  imports: [AuthModule],
  providers: [
      ...EXTERNAL_PROVIDERS,
      NotificationsService,
      UserEventHandler,
      OptionsProvider<number>(NOTIFICATION_BLOCK_TIMEOUT),
      OptionsProvider<number>(SSE_HEARTBEAT_PERIOD),
      OptionsProvider<number>(STREAM_MAX_LENGTH),
      OptionsProvider<number>(NOTIFICATION_LOOP_DELAY),
  ],
  controllers: [NotificationsController]
})
export class NotificationsModule {}