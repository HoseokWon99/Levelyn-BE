import { CallHandler, ExecutionContext, Inject, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import { MonitoringService } from './monitoring.service';

@Injectable()
export class SseMonitoringInterceptor implements NestInterceptor {
    constructor(
        @Inject(MonitoringService)
        private readonly _monitoring: MonitoringService,
    ) {}

    intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
        const req = ctx.switchToHttp().getRequest();
        const userId: number = req.user?.id ?? req.user?.userId ?? 0;
        const endpoint: string = req.url;
        // For BattlesController where userId is 0, use params.id to distinguish connections
        const connectionKey = userId !== 0 ? userId : -(Math.random() * 1e9 | 0);
        this._monitoring.registerSseConnection(connectionKey, endpoint);
        return next.handle().pipe(
            tap(() => this._monitoring.recordNotificationSent()),
            finalize(() => this._monitoring.unregisterSseConnection(connectionKey)),
        );
    }
}
