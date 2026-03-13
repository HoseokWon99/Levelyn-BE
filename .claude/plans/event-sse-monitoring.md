# Implementation Plan: Event Monitoring + SSE Connection Monitoring

## Analysis Summary

- `prom-client` / `@nestjs/terminus` are not installed. Only Logger and Redis (ioredis) are available.
- NestJS CQRS v11 does not expose public interceptor hooks on EventBus/CommandBus — must extend the classes.
- Two active SSE endpoints: `/api/notifications` (Redis queue) and `/api/battles/:id` (battle turn stream).
- `NotificationsInterceptor` is the proven pattern: it uses `tap()` on the Observable.
- `node-cache` is installed — usable for in-memory counters without Redis overhead.

## Design Decisions

### Storage: In-Memory Counters (MonitoringService singleton)
Plain in-process singleton holding `Map<string, EventRecord>` counters and `Map<number, Date>` for active SSE connections. Exposed via `GET /api/monitoring` as JSON snapshot. Swappable for Prometheus later by replacing only `MonitoringService` internals.

### CQRS Monitoring: MonitoredEventBus + MonitoredCommandBus
Extend NestJS `EventBus` and `CommandBus`, override `publish()`/`execute()` to instrument every event/command by class name automatically — no handler-level changes needed.

Register via `{ provide: EventBus, useClass: MonitoredEventBus }` syntax (not direct class extension binding) to correctly replace the DI token.

### SSE Monitoring: SseMonitoringInterceptor
`NestInterceptor` using `tap()` (count messages) and `finalize()` (unregister on disconnect). Applied to both SSE controllers via `@UseInterceptors`.

---

## New Files

### `src/monitoring/monitoring.service.ts`

```typescript
interface EventRecord {
  count: number;
  failures: number;
  totalLatencyMs: number;
}

@Injectable()
export class MonitoringService {
  private readonly events = new Map<string, EventRecord>();
  private readonly commands = new Map<string, EventRecord>();
  private readonly sseConnections = new Map<number, { connectedAt: Date; endpoint: string }>();
  private notificationsSent = 0;

  recordEvent(name: string, latencyMs: number, failed: boolean): void
  recordCommand(name: string, latencyMs: number, failed: boolean): void
  registerSseConnection(userId: number, endpoint: string): void
  unregisterSseConnection(userId: number): void
  recordNotificationSent(): void
  getSnapshot(): MonitoringSnapshot
}
```

### `src/monitoring/monitoring.controller.ts`
`GET /api/monitoring` — returns `monitoringService.getSnapshot()` as JSON. `@ApiTags("Monitoring")`.

### `src/monitoring/monitored-event-bus.ts`
Extends `EventBus`, overrides `publish()` with timing + `monitoringService.recordEvent(...)`.

### `src/monitoring/monitored-command-bus.ts`
Extends `CommandBus`, overrides `execute()` with timing + `monitoringService.recordCommand(...)`.

### `src/monitoring/sse-monitoring.interceptor.ts`

```typescript
@Injectable()
export class SseMonitoringInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const req = ctx.switchToHttp().getRequest();
    const userId: number = req.user?.userId ?? req.user?.id ?? 0;
    const url: string = req.url;
    this._monitoring.registerSseConnection(userId, url);
    return next.handle().pipe(
      tap(() => this._monitoring.recordNotificationSent()),
      finalize(() => this._monitoring.unregisterSseConnection(userId))
    );
  }
}
```

Note: `BattlesController` has no auth guard — use `req.params.id` as key fallback when `userId === 0`.

### `src/monitoring/monitoring.module.ts`

```typescript
@Global()
@Module({
  providers: [
    MonitoringService,
    { provide: EventBus, useClass: MonitoredEventBus },
    { provide: CommandBus, useClass: MonitoredCommandBus },
    SseMonitoringInterceptor,
  ],
  controllers: [MonitoringController],
  exports: [MonitoringService, SseMonitoringInterceptor]
})
export class MonitoringModule {}
```

### `src/monitoring/index.ts`
Barrel export for all public symbols.

---

## Modified Files

### `src/app.module.ts`
Add `MonitoringModule` to imports (after `CqrsModule.forRoot()`):
```typescript
import { MonitoringModule } from "./monitoring";
// ...
imports: [ CqrsModule.forRoot(), ..., MonitoringModule ]
```

### `src/notifications/notifications.controller.ts`
```typescript
@UseInterceptors(SseInterceptor, NotificationsInterceptor, SseMonitoringInterceptor)
```

### `src/battles/battles.controller.ts`
```typescript
@UseInterceptors(SseInterceptor, SseMonitoringInterceptor)
```

---

## Metrics Snapshot (`GET /api/monitoring`)

```json
{
  "events": {
    "BattleEndedEvent": { "count": 42, "failures": 1, "avgLatencyMs": 12 },
    "ToDoFulfilledEvent": { "count": 100, "failures": 0, "avgLatencyMs": 5 }
  },
  "commands": {
    "CreateBattleCommand": { "count": 38, "failures": 2, "avgLatencyMs": 145 },
    "RewardUserCommand": { "count": 64, "failures": 0, "avgLatencyMs": 78 },
    "SetPenaltyCommand": { "count": 4, "failures": 0, "avgLatencyMs": 20 }
  },
  "sse": {
    "activeConnections": 3,
    "connections": [
      { "userId": 7, "endpoint": "/api/notifications", "connectedAt": "..." },
      { "userId": 0, "endpoint": "/api/battles/abc123", "connectedAt": "..." }
    ],
    "notificationsSent": 312
  },
  "capturedAt": "2026-03-13T10:05:00.000Z"
}
```

---

## Implementation Order

1. `MonitoringService` — pure TS, no deps, testable alone
2. `MonitoredEventBus` + `MonitoredCommandBus` — verify `EventBus`/`CommandBus` constructor args from `node_modules/@nestjs/cqrs/dist/` first
3. `SseMonitoringInterceptor`
4. `MonitoringController` + `MonitoringModule`
5. Register `MonitoringModule` in `AppModule`
6. Add `SseMonitoringInterceptor` to `NotificationsController` and `BattlesController`

---

## Key Risks

| Risk | Mitigation |
|------|-----------|
| `EventBus`/`CommandBus` DI token replacement | Use `{ provide: EventBus, useClass: MonitoredEventBus }` — not direct class binding |
| `finalize()` firing too early | Intended: fires on complete, error, or unsubscribe (client disconnect) |
| `userId` unavailable in `BattlesController` SSE | Use `req.params.id` (battle session ID) as connection key fallback |
| Circular dependency with `@Global()` MonitoringModule | `MonitoringModule` has no domain imports — low risk; ensure `CqrsModule.forRoot()` is before it |
