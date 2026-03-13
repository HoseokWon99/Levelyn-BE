# SSE Endpoint Test Plan

## Scope

Tests for `GET /api/notifications` — the SSE push endpoint.

Existing coverage: `notifications.service.spec.ts` covers `NotificationsService` in isolation.

Missing coverage:
1. `NotificationsController` unit test
2. `UserEventHandler` unit test
3. E2E test for the full SSE endpoint

---

## 1. Controller Unit Test — `notifications.controller.spec.ts`

**File:** `src/notifications/notifications.controller.spec.ts`

### Test cases

| # | Description | Key assertion |
|---|---|---|
| 1 | `notifyUser` returns an Observable | result is Observable |
| 2 | Emits heartbeat pings at configured interval | interval emissions map to `{ event: "ping" }` |
| 3 | Merges notifications from `NotificationsService` | `service.getUserNotifications(userId)` called; emissions appear in merged stream |
| 4 | Passes `lastId` query param to service | `service.getUserNotifications(userId, lastId)` called with correct args |

### Setup
```ts
const mockNotificationsService = {
  getUserNotifications: jest.fn().mockReturnValue(EMPTY),
};
// provide SSE_HEARTBEAT_PERIOD = 100 (ms)
// override SseJwtAuthGuard to always allow
// no monitoring interceptor — only SseInterceptor is used
```

---

## 2. Event Handler Unit Test — `user.event.handler.spec.ts`

**File:** `src/notifications/user.event.handler.spec.ts`

> Replaces the old interceptor test. `UserEventHandler` is the CQRS event handler that bridges
> published `UserEvent`s to the Redis stream via `NotificationsService.addUserEvent`.

### Test cases

| # | Description | Key assertion |
|---|---|---|
| 1 | Calls `addUserEvent` with the received `UserEvent` | `service.addUserEvent(event)` called once |
| 2 | Logs the event at debug level | `logger.debug` called with event |
| 3 | Swallows `addUserEvent` errors (does not rethrow) | no rejection; `logger.error` called |

### Setup
```ts
const mockNotificationsService = {
  addUserEvent: jest.fn().mockResolvedValue('1234-0'),
};
// instantiate UserEventHandler with mocked NotificationsService
```

---

## 3. E2E Test — `notifications.e2e-spec.ts`

**File:** `test/notifications.e2e-spec.ts`

### Strategy

1. **Docker Redis** — spin up a real `redis:7-alpine` container via `testcontainers`
2. **Minimal TestingModule** — register `CqrsModule.forRoot()` + `NotificationsController` + `NotificationsService` + `UserEventHandler` directly (no `NotificationsModule` / `AuthModule` to avoid TypeORM deps)
3. **Trigger saga** — call `eventBus.publish(new UserEvent(userId, topic, data))` after SSE connection is open; `UserEventHandler` handles it → `NotificationsService.addUserEvent()` → Redis stream
4. **Observe SSE** — use Node `http.get` to get a raw streaming response and match incoming chunks

### Test cases

| # | Description | Expected |
|---|---|---|
| 1 | UserEvent published to EventBus appears in SSE stream | chunk contains topic and payload JSON |

### Module setup
```ts
await Test.createTestingModule({
    imports: [CqrsModule.forRoot()],
    controllers: [NotificationsController],
    providers: [
        NotificationsService,
        UserEventHandler,
        { provide: Redis, useValue: redis },             // real Redis → testcontainer
        { provide: SseJwtAuthGuard, useClass: FakeSseJwtAuthGuard },
        { provide: NOTIFICATION_BLOCK_TIMEOUT, useValue: 200 },
        { provide: NOTIFICATION_LOOP_DELAY, useValue: 0 },
        { provide: STREAM_MAX_LENGTH, useValue: 100 },
        { provide: SSE_HEARTBEAT_PERIOD, useValue: 60_000 }, // disable heartbeat noise
    ],
}).compile();
```

### SSE consumption
```ts
http.get(`http://localhost:${port}/api/notifications`, { headers: { Accept: 'text/event-stream' } }, (res) => {
    res.on('data', (chunk: string) => {
        if (chunk.includes('"REWARD"')) resolve(chunk);
    });
});
// Publish after 200ms to let connection establish
setTimeout(() => eventBus.publish(new UserEvent(1, 'REWARD', { coins: 100 })), 200);
```

---

## File Summary

```
src/notifications/
  notifications.controller.spec.ts   ← new
  user.event.handler.spec.ts         ← new (replaces interceptor spec)
  notifications.service.spec.ts      ← exists

test/
  notifications.e2e-spec.ts          ← new (implemented)
```

## Dependencies added

- `testcontainers` (devDependency) — spins up `redis:7-alpine` Docker container for E2E
