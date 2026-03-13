# Implementation Plan: Redis-Based Event Store for CQRS

## Context

The Levelyn-BE application uses NestJS CQRS with an **in-memory event bus** where events are ephemeral - once processed, they're gone. There is no event persistence, audit trail, or replay capability.

**User Requirements:**
- **Primary Goal**: Event Store for audit trail, debugging, and potential event replay
- **Scope**: Store ALL events and commands flowing through the system
- **Retention**: 7-30 days with automatic trimming
- **Use Cases**: Debugging game logic, investigating user issues, replaying events for testing, audit compliance

**Current CQRS Architecture:**
- Events: `ToDoFulfilledEvent`, `BattleEndedEvent`, `BattleCreatedEvent`, `WalletUpdatedEvent`, `UserEvent`
- Commands: `CreateBattleCommand`, `ExecuteBattleCommand`, `RewardUserCommand`, `SetPenaltyCommand`, `UpdateStateCommand`, `UpdateWalletCommand`, `AddUserItemsCommand`, `UnlockSkillsCommand`
- Sagas: `TilesSaga`, `BattlesSaga` (orchestrate event → command flows)
- Buses: `MonitoredEventBus` and `MonitoredCommandBus` (extends NestJS CQRS with metrics)

**Why Redis Streams?**
- Sequential ordering with immutable auto-generated IDs (`timestamp-sequence`)
- Built-in retention strategies (MAXLEN or time-based trimming)
- Efficient range queries (`XRANGE`, `XREAD`)
- Supports consumer groups for future distributed processing
- Already using Redis (ioredis v5.6.1) for battles, notifications, JWT blacklist

---

## High-Level Strategy

### 1. Stream Structure

**Recommended Approach**: **Dual-stream pattern**

```
events:all           → Global stream for ALL events (main audit log)
commands:all         → Global stream for ALL commands (command audit log)
```

**Rationale:**
- **Simple querying**: Single stream per message type makes queries straightforward
- **Efficient storage**: No duplication, easy to estimate memory usage
- **Flexible filtering**: Can filter by event/command type using `eventType` field
- **Future extensibility**: Can add per-user or per-aggregate streams later if needed

**Alternative (not recommended for this use case)**:
- Per-type streams (`events:ToDoFulfilledEvent`, `commands:CreateBattleCommand`) - too many streams, harder to query chronologically
- Per-user streams (`events:user:{userId}`) - duplicates global events, harder to get system-wide view

---

### 2. Message Format

**Stored Event Schema:**

```typescript
interface StoredEvent {
    id: string;              // cuid2
    topic: string;            // Event class name (e.g., "ToDoFulfilledEvent")
    timestamp: string;            // ISO 8601 format
    payload: Record<string, any>; // Original event data (userId, etc.)
    metadata: {
        version: string;          // Event schema version (e.g., "1.0")
        correlationId?: string;   // For tracing related events (future)
        causationId?: string;     // ID of triggering event (future)
    };
}
```

**Stored Command Schema:**
```typescript
interface StoredCommand {
    commandId: string;
    commandType: string;          // Command class name
    timestamp: string;
    payload: Record<string, any>;
    metadata: {
        version: string;
        correlationId?: string;
        userId?: number;          // For user-initiated commands
    };
}
```

**Redis Stream Entry:**
```
XADD events:all MAXLEN ~ 50000 * \
  data "{\"eventId\":\"...\",\"eventType\":\"ToDoFulfilledEvent\",\"timestamp\":\"...\",\"payload\":{...}}"
```

---

### 3. Retention Strategy

**Max Length Approach (Recommended)**:
- Use `MAXLEN ~ N` with approximate trimming (`~` for performance)
- **Calculation**:
  - Estimated volume: ~1000 events/day + ~500 commands/day = 1500 messages/day
  - 30 days retention: 1500 × 30 = 45,000 messages
  - **Safe limit**: `MAXLEN ~ 50000` (allows headroom for bursts)

**Configuration:**
```env
# .env
EVENT_STORE_MAX_LENGTH=50000    # ~30 days at 1500 msgs/day
COMMAND_STORE_MAX_LENGTH=50000  # Same as events
```

**Future Enhancement (Phase 2)**:
- Time-based trimming using background job + `XTRIM` with `MINID` based on timestamp
- Archive old events to S3/DynamoDB for long-term storage

---

## Implementation Approach

### Phase 1: Core Event Store Service

#### 1.1. Create EventStore Module

**New Directory Structure:**
```
src/event-store/
├── event-store.module.ts
├── event-store.service.ts
├── event-store.service.spec.ts
├── schema/
│   ├── stored-event.ts
│   └── stored-command.ts
├── token.ts
└── index.ts
```

**Files to Create:**

1. **`src/event-store/token.ts`**
   ```typescript
   export const EVENT_STORE_MAX_LENGTH = Symbol("EVENT_STORE_MAX_LENGTH");
   export const COMMAND_STORE_MAX_LENGTH = Symbol("COMMAND_STORE_MAX_LENGTH");
   ```

2. **`src/event-store/schema/stored-event.ts`**
   ```typescript
   export interface StoredEvent {
       eventId: string;
       eventType: string;
       timestamp: string;
       payload: Record<string, any>;
       metadata: {
           version: string;
           correlationId?: string;
           causationId?: string;
       };
   }
   ```

3. **`src/event-store/schema/stored-command.ts`**
   ```typescript
   export interface StoredCommand {
       commandId: string;
       commandType: string;
       timestamp: string;
       payload: Record<string, any>;
       metadata: {
           version: string;
           correlationId?: string;
           userId?: number;
       };
   }
   ```

4. **`src/event-store/event-store.service.ts`**
   - `appendEvent(event: any): Promise<string>` - Store event to `events:all`
   - `appendCommand(command: any): Promise<string>` - Store command to `commands:all`
   - `getEvents(options?: QueryOptions): Promise<StoredEvent[]>` - Query events
   - `getCommands(options?: QueryOptions): Promise<StoredCommand[]>` - Query commands

   **QueryOptions:**
   ```typescript
   interface QueryOptions {
       start?: string;      // Stream ID or "-" for beginning
       end?: string;        // Stream ID or "+" for end
       count?: number;      // Max results (default 100)
       eventType?: string;  // Filter by event type
       userId?: number;     // Filter by userId (if in payload)
   }
   ```

5. **`src/event-store/event-store.module.ts`**
   ```typescript
   @Global()
   @Module({
       providers: [
           EventStoreService,
           OptionsProvider<number>(EVENT_STORE_MAX_LENGTH),
           OptionsProvider<number>(COMMAND_STORE_MAX_LENGTH)
       ],
       exports: [EventStoreService]
   })
   export class EventStoreModule {}
   ```

---

#### 1.2. EventStore Service Implementation

**Key Methods:**

**1. appendEvent()**
```typescript
async appendEvent(event: any): Promise<string> {
    const eventType = event.constructor.name;
    const storedEvent: StoredEvent = {
        eventId: crypto.randomUUID().replaceAll('-', ''),
        eventType,
        timestamp: new Date().toISOString(),
        payload: { ...event }, // Serialize event fields
        metadata: {
            version: '1.0'
        }
    };

    const streamId = await this._redis.xadd(
        'events:all',
        'MAXLEN', '~', this._eventsMaxLength,
        '*',
        'data', JSON.stringify(storedEvent)
    );

    this._logger.debug(`Event stored: ${eventType} -> ${streamId}`);
    return streamId as string;
}
```

**2. appendCommand()**
```typescript
async appendCommand(command: any): Promise<string> {
    const commandType = command.constructor.name;
    const storedCommand: StoredCommand = {
        commandId: crypto.randomUUID().replaceAll('-', ''),
        commandType,
        timestamp: new Date().toISOString(),
        payload: { ...command },
        metadata: {
            version: '1.0',
            userId: command.userId || command.payload?.userId
        }
    };

    const streamId = await this._redis.xadd(
        'commands:all',
        'MAXLEN', '~', this._commandsMaxLength,
        '*',
        'data', JSON.stringify(storedCommand)
    );

    this._logger.debug(`Command stored: ${commandType} -> ${streamId}`);
    return streamId as string;
}
```

**3. getEvents() with filtering**
```typescript
async getEvents(options: QueryOptions = {}): Promise<StoredEvent[]> {
    const { start = '-', end = '+', count = 100, eventType, userId } = options;

    const results = await this._redis.xrange(
        'events:all',
        start,
        end,
        'COUNT', count
    );

    let events = results.map(([id, fields]) => {
        const data = fields[fields.indexOf('data') + 1];
        return JSON.parse(data) as StoredEvent;
    });

    // Client-side filtering (for now; consider server-side later)
    if (eventType) {
        events = events.filter(e => e.eventType === eventType);
    }

    if (userId) {
        events = events.filter(e => e.payload.userId === userId);
    }

    return events;
}
```

---

### Phase 2: Integration with CQRS Buses

#### 2.1. Extend MonitoredEventBus

**File**: `/Users/hoseok/services/levelyn/Levelyn-BE/src/monitoring/monitored-event-bus.ts`

**Strategy**: Hook into `publish()` method to persist events to EventStore asynchronously

```typescript
@Injectable()
export class MonitoredEventBus extends EventBus {
    constructor(
        private readonly _monitoring: MonitoringService,
        @Inject(EventStoreService) // NEW
        private readonly _eventStore: EventStoreService // NEW
    ) {
        super();
    }

    publish<T extends IEvent>(event: T): any {
        const name = event.constructor.name;
        const start = Date.now();
        let failed = false;

        try {
            const result = super.publish(event);

            // Persist event to store (fire-and-forget, non-blocking)
            this._eventStore.appendEvent(event)
                .catch(err => {
                    this._logger.error(`Failed to store event ${name}:`, err);
                });

            return result;
        } catch (err) {
            failed = true;
            throw err;
        } finally {
            this._monitoring.recordEvent(name, Date.now() - start, failed);
        }
    }
}
```

**Critical**: Use `.catch()` instead of `await` to avoid blocking event processing. EventStore failures should NOT break the main event flow.

---

#### 2.2. Extend MonitoredCommandBus

**File**: `/Users/hoseok/services/levelyn/Levelyn-BE/src/monitoring/monitored-command-bus.ts`

**Strategy**: Hook into `execute()` method to persist commands

```typescript
@Injectable()
export class MonitoredCommandBus extends CommandBus {
    constructor(
        private readonly _monitoring: MonitoringService,
        @Inject(EventStoreService) // NEW
        private readonly _eventStore: EventStoreService // NEW
    ) {
        super();
    }

    async execute<T extends ICommand, R>(command: T): Promise<R> {
        const name = command.constructor.name;
        const start = Date.now();
        let failed = false;

        try {
            // Persist command BEFORE execution (for complete audit trail)
            this._eventStore.appendCommand(command)
                .catch(err => {
                    this._logger.error(`Failed to store command ${name}:`, err);
                });

            const result = await super.execute(command);
            return result;
        } catch (err) {
            failed = true;
            throw err;
        } finally {
            this._monitoring.recordCommand(name, Date.now() - start, failed);
        }
    }
}
```

---

### Phase 3: Query API (Optional but Recommended)

**Create an Admin Endpoint for Querying Event Store**

**File**: `src/event-store/event-store.controller.ts`

```typescript
@ApiTags('EventStore')
@Controller('/api/admin/event-store')
@UseGuards(JwtAuthGuard) // Protect with admin-only guard
export class EventStoreController {
    constructor(
        @Inject(EventStoreService)
        private readonly _eventStore: EventStoreService
    ) {}

    @Get('/events')
    @ApiQuery({ name: 'eventType', required: false })
    @ApiQuery({ name: 'userId', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getEvents(
        @Query('eventType') eventType?: string,
        @Query('userId') userId?: number,
        @Query('limit') limit?: number
    ) {
        return this._eventStore.getEvents({
            eventType,
            userId,
            count: limit || 100
        });
    }

    @Get('/commands')
    @ApiQuery({ name: 'commandType', required: false })
    @ApiQuery({ name: 'userId', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getCommands(
        @Query('commandType') commandType?: string,
        @Query('userId') userId?: number,
        @Query('limit') limit?: number
    ) {
        return this._eventStore.getCommands({
            commandType,
            userId,
            count: limit || 100
        });
    }

    @Get('/stats')
    async getStats() {
        const eventsCount = await this._redis.xlen('events:all');
        const commandsCount = await this._redis.xlen('commands:all');

        return {
            events: {
                count: eventsCount,
                stream: 'events:all'
            },
            commands: {
                count: commandsCount,
                stream: 'commands:all'
            }
        };
    }
}
```

**Usage Examples:**
```bash
# Get all recent events
GET /api/admin/event-store/events?limit=50

# Get events for specific user
GET /api/admin/event-store/events?userId=123

# Get specific event type
GET /api/admin/event-store/events?eventType=BattleEndedEvent

# Get stats
GET /api/admin/event-store/stats
```

---

## Critical Files to Modify/Create

### New Files (Phase 1):
1. `src/event-store/event-store.module.ts` - Module definition
2. `src/event-store/event-store.service.ts` - Core service
3. `src/event-store/event-store.service.spec.ts` - Unit tests
4. `src/event-store/token.ts` - DI tokens
5. `src/event-store/schema/stored-event.ts` - Event schema
6. `src/event-store/schema/stored-command.ts` - Command schema
7. `src/event-store/index.ts` - Barrel export

### Modified Files (Phase 2):
8. `src/monitoring/monitored-event-bus.ts` - Inject EventStoreService, persist on publish
9. `src/monitoring/monitored-command-bus.ts` - Inject EventStoreService, persist on execute
10. `src/monitoring/monitoring.module.ts` - Import EventStoreModule

### New Files (Phase 3 - Optional):
11. `src/event-store/event-store.controller.ts` - Query API
12. `src/event-store/dto/query-options.dto.ts` - DTO for query params

### Configuration:
13. `.env` - Add EVENT_STORE_MAX_LENGTH, COMMAND_STORE_MAX_LENGTH
14. `.env.example` - Document new env vars
15. `src/app.module.ts` - Import EventStoreModule globally

---

## Configuration Strategy

### Environment Variables

**`.env` and `.env.example`:**
```env
# Event Store Configuration
EVENT_STORE_MAX_LENGTH=50000      # Max events in stream (~30 days at 1500/day)
COMMAND_STORE_MAX_LENGTH=50000    # Max commands in stream
```

### Module Registration

**`src/app.module.ts`:**
```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CqrsModule.forRoot(),
    TypeOrmModule.forRoot(...),
    RedisModule.forRoot(...),
    EventStoreModule,  // NEW: Add globally
    MonitoringModule,
    // ... other modules
  ]
})
export class AppModule {}
```

---

## Testing Strategy

### Unit Tests

**File**: `src/event-store/event-store.service.spec.ts`

```typescript
describe('EventStoreService', () => {
    let service: EventStoreService;
    let redisMock: Partial<Redis>;

    beforeEach(async () => {
        redisMock = {
            xadd: jest.fn().mockResolvedValue('1678901234567-0'),
            xrange: jest.fn().mockResolvedValue([]),
            xlen: jest.fn().mockResolvedValue(1000)
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EventStoreService,
                { provide: Redis, useValue: redisMock },
                { provide: EVENT_STORE_MAX_LENGTH, useValue: 50000 },
                { provide: COMMAND_STORE_MAX_LENGTH, useValue: 50000 }
            ]
        }).compile();

        service = module.get<EventStoreService>(EventStoreService);
    });

    it('should store event to Redis Stream', async () => {
        const event = new ToDoFulfilledEvent(123);
        const streamId = await service.appendEvent(event);

        expect(streamId).toBe('1678901234567-0');
        expect(redisMock.xadd).toHaveBeenCalledWith(
            'events:all',
            'MAXLEN', '~', 50000,
            '*',
            'data', expect.stringContaining('ToDoFulfilledEvent')
        );
    });

    it('should query events by type', async () => {
        redisMock.xrange = jest.fn().mockResolvedValue([
            ['1000-0', ['data', JSON.stringify({
                eventType: 'ToDoFulfilledEvent',
                payload: { userId: 123 }
            })]]
        ]);

        const events = await service.getEvents({ eventType: 'ToDoFulfilledEvent' });

        expect(events).toHaveLength(1);
        expect(events[0].eventType).toBe('ToDoFulfilledEvent');
    });
});
```

### Integration Tests

**File**: `src/event-store/event-store.integration.spec.ts`

```typescript
describe('EventStore Integration', () => {
    let redis: Redis;
    let eventBus: EventBus;
    let commandBus: CommandBus;

    beforeEach(async () => {
        redis = new Redis({ host: 'localhost', port: 6379 });
        // ... setup TestingModule with real Redis
    });

    afterEach(async () => {
        await redis.del('events:all', 'commands:all');
        await redis.quit();
    });

    it('should persist events published to EventBus', async () => {
        const event = new ToDoFulfilledEvent(123);
        eventBus.publish(event);

        await new Promise(resolve => setTimeout(resolve, 100)); // Allow async persistence

        const count = await redis.xlen('events:all');
        expect(count).toBe(1);

        const entries = await redis.xrange('events:all', '-', '+');
        expect(entries).toHaveLength(1);

        const storedEvent = JSON.parse(entries[0][1][1]);
        expect(storedEvent.eventType).toBe('ToDoFulfilledEvent');
    });
});
```

---

## Monitoring & Observability

### 1. Extend MonitoringService

**File**: `src/monitoring/monitoring.service.ts`

Add Event Store metrics:

```typescript
interface EventStoreMetrics {
    eventsStored: number;
    commandsStored: number;
    storageFailures: number;
}

class MonitoringService {
    private _eventStoreMetrics: EventStoreMetrics = {
        eventsStored: 0,
        commandsStored: 0,
        storageFailures: 0
    };

    recordEventStored() {
        this._eventStoreMetrics.eventsStored++;
    }

    recordCommandStored() {
        this._eventStoreMetrics.commandsStored++;
    }

    recordStorageFailure() {
        this._eventStoreMetrics.storageFailures++;
    }

    getSnapshot() {
        return {
            // ... existing metrics
            eventStore: this._eventStoreMetrics
        };
    }
}
```

### 2. Add Logging

EventStoreService should log:
- `DEBUG`: Each event/command stored with type and stream ID
- `ERROR`: Storage failures with stack trace
- `INFO`: Periodic stats (every 1000 events)

### 3. Health Check

Add Redis Stream health check to `/api/health`:

```typescript
async checkEventStore(): Promise<boolean> {
    try {
        const count = await this._redis.xlen('events:all');
        return count >= 0; // Stream accessible
    } catch (err) {
        return false;
    }
}
```

---

## Migration & Rollout Strategy

### Phase 1: Deploy Event Store (Non-Breaking)

**Steps:**
1. Deploy new EventStore module alongside existing system
2. Events/commands start being persisted automatically
3. Monitor Redis memory usage via `INFO memory`
4. Verify streams are growing: `XLEN events:all`, `XLEN commands:all`

**Rollback**: Remove EventStore module, delete streams

**Zero Risk**: EventStore operates as write-only sideline; failures don't impact main CQRS flow

---

### Phase 2: Enable Query API (Optional)

**Steps:**
1. Deploy EventStoreController with admin-only auth
2. Test queries via Swagger UI or curl
3. Use for debugging and user support

**Rollback**: Remove controller, streams remain intact

---

### Phase 3: Event Replay (Future)

**Not in initial scope**, but architecture supports:
- Read events from store
- Re-publish to EventBus with `replay: true` flag
- Test saga behavior with historical data

---

## Performance Considerations

### Memory Usage Estimation

**Single Event Size**: ~200-500 bytes (JSON serialized)
**Max Stream Length**: 50,000 events
**Total Memory**: 50KB × 200 bytes × 2 streams (events + commands) ≈ **20 MB**

**For 1,000 active users** with per-user streams (future): ~200 MB

✅ **Acceptable** for Redis in-memory storage

### Latency Impact

**Event/Command Processing**:
- EventStore uses fire-and-forget (`.catch()` instead of `await`)
- **No blocking** of main CQRS flow
- EventStore failures logged but don't throw

**Query Performance**:
- `XRANGE` is O(N) where N = returned entries (limited by `COUNT`)
- Client-side filtering for complex queries (acceptable for admin tool)
- Future: Use Lua scripts for server-side filtering

### Retention Trimming

**MAXLEN ~ N**:
- Approximate trimming (`~`) for better performance
- Trim happens on every `XADD` (minimal overhead)
- No background job required

---

## Verification Steps

### 1. Check Event Store Creation
```bash
redis-cli

# Verify streams exist
XLEN events:all
XLEN commands:all

# View recent events
XRANGE events:all - + COUNT 10

# View recent commands
XRANGE commands:all - + COUNT 10
```

### 2. Trigger Events and Verify Storage
```bash
# Complete a to-do via API
POST /api/to-do/fulfill

# Check event was stored
redis-cli XRANGE events:all - + COUNT 1

# Expected output:
# 1) "1678901234567-0"
#    1) "data"
#    2) "{\"eventId\":\"...\",\"eventType\":\"ToDoFulfilledEvent\",\"payload\":{\"userId\":123}}"
```

### 3. Query via API
```bash
# Get recent events
GET /api/admin/event-store/events?limit=10

# Get user-specific events
GET /api/admin/event-store/events?userId=123

# Get stats
GET /api/admin/event-store/stats
```

### 4. Monitor Memory
```bash
redis-cli INFO memory

# Watch for:
# - used_memory_human (should grow slowly)
# - used_memory_peak (check after 1 week)
```

### 5. Check Monitoring Metrics
```bash
GET /api/monitoring

# Response should include:
# {
#   "eventStore": {
#     "eventsStored": 1234,
#     "commandsStored": 567,
#     "storageFailures": 0
#   }
# }
```

---

## Future Enhancements

### 1. Correlation & Causation IDs

Add trace context to track event chains:
```typescript
metadata: {
    correlationId: "user-action-uuid",  // Groups related events
    causationId: "parent-event-id"      // Direct parent event
}
```

### 2. Event Replay Service

```typescript
class EventReplayService {
    async replay(options: ReplayOptions): Promise<void> {
        const events = await this._eventStore.getEvents(options);
        for (const storedEvent of events) {
            const event = this.deserializeEvent(storedEvent);
            this._eventBus.publish(event);
        }
    }
}
```

### 3. Archival Strategy

For indefinite retention:
- Background job scans streams older than 30 days
- Archive to S3/DynamoDB using `XRANGE` + date filtering
- `XTRIM` old entries from Redis

### 4. Per-User Streams

If query patterns favor user-specific lookups:
```
events:user:{userId}
commands:user:{userId}
```

Dual-write to both global (`events:all`) and per-user streams.

---

## Summary

| Aspect | Solution |
|--------|----------|
| **Storage** | Redis Streams (`events:all`, `commands:all`) |
| **Retention** | MAXLEN ~ 50000 (~30 days at 1500 msgs/day) |
| **Integration** | Extend MonitoredEventBus & MonitoredCommandBus |
| **Querying** | EventStore.getEvents() + optional REST API |
| **Performance** | Fire-and-forget persistence (non-blocking) |
| **Memory** | ~20 MB for 50K events+commands |
| **Testing** | Unit tests (mocked Redis) + Integration tests (real Redis) |
| **Rollout** | Non-breaking, zero-risk deployment |
| **Monitoring** | Metrics via MonitoringService, logs, health checks |

