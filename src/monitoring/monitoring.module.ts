import { Global, Module } from '@nestjs/common';
import { CommandBus, EventBus } from '@nestjs/cqrs';
import { MonitoringService } from './monitoring.service';
import { MonitoredEventBus } from './monitored-event-bus';
import { MonitoredCommandBus } from './monitored-command-bus';
import { SseMonitoringInterceptor } from './sse-monitoring.interceptor';
import { MonitoringController } from './monitoring.controller';

@Global()
@Module({
    providers: [
        MonitoringService,
        { provide: EventBus, useClass: MonitoredEventBus },
        { provide: CommandBus, useClass: MonitoredCommandBus },
        SseMonitoringInterceptor,
    ],
    controllers: [MonitoringController],
    exports: [MonitoringService, SseMonitoringInterceptor],
})
export class MonitoringModule {}
