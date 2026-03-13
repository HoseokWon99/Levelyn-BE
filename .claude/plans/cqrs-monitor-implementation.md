# CqrsMonitorService Implementation Plan

## Goal
Subscribe to all three CQRS buses (Event, Command, Query), record each published/executed item to Elasticsearch for observability.

---

## 1. How Each Bus Can Be Monitored

### EventBus
`EventBus` extends `Subject<IEvent>` (RxJS), so it is directly subscribable:
```typescript
this._eventBus.subscribe(event => this.recordPublished("event", event));
```

### CommandBus / QueryBus
These do **not** expose an observable stream — they execute synchronously via `.execute()`.
Monitoring approach: **wrap `.execute()` with a Proxy** in `onModuleInit` to intercept every call.

```typescript
// Proxy pattern to intercept execute()
const original = this._commandBus.execute.bind(this._commandBus);
this._commandBus.execute = async (cmd) => {
    await this.recordPublished("command", cmd);
    return original(cmd);
};
```

---

## 2. Elasticsearch Document Schema

Index name: `cqrs-monitor-{YYYY-MM-DD}` (daily rolling)

```typescript
interface MonitorDocument {
    type: "event" | "command" | "query";
    name: string;         // constructor name (e.g. "ToDoFulfilledEvent")
    timestamp: string;    // ISO 8601
    payload: unknown;     // full serialized data object
}
```

---

## 3. Files to Create / Modify

### New: `src/monitor/monitor.module.ts`
- Import `ElasticsearchModule.registerAsync(...)` configured from `ConfigService`
- Provide `CqrsMonitorService`
- Export `CqrsMonitorService`

### Modify: `src/monitor/index.ts`
- Export `MonitorModule` and `CqrsMonitorService`

### Modify: `src/monitor/cqrs.monitor.service.ts`
- Implement `onModuleInit` — subscribe to EventBus, wrap CommandBus and QueryBus
- Implement `recordPublished` — index document to Elasticsearch

### Modify: `src/app.module.ts`
- Import `MonitorModule`

### Modify: `.env`
- Add `ELASTICSEARCH_NODE` (e.g. `http://localhost:9200`)

---

## 4. Implementation Details

### `cqrs.monitor.service.ts`

```typescript
import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { CommandBus, EventBus, QueryBus } from "@nestjs/cqrs";
import { ElasticsearchService } from "@nestjs/elasticsearch";

type __PublishedType = "event" | "command" | "query";

@Injectable()
export class CqrsMonitorService implements OnModuleInit {
    private readonly _logger = new Logger(CqrsMonitorService.name);

    constructor(
        @Inject(EventBus)
        private readonly _eventBus: EventBus,
        @Inject(CommandBus)
        private readonly _commandBus: CommandBus,
        @Inject(QueryBus)
        private readonly _queryBus: QueryBus,
        @Inject(ElasticsearchService)
        private readonly _elasticsearch: ElasticsearchService,
    ) {}

    onModuleInit() {
        // 1. Subscribe to EventBus (it IS a Subject)
        this._eventBus.subscribe(event =>
            this.recordPublished("event", event)
        );

        // 2. Intercept CommandBus.execute via proxy
        const origCmd = this._commandBus.execute.bind(this._commandBus);
        this._commandBus.execute = async (cmd) => {
            await this.recordPublished("command", cmd);
            return origCmd(cmd);
        };

        // 3. Intercept QueryBus.execute via proxy
        const origQry = this._queryBus.execute.bind(this._queryBus);
        this._queryBus.execute = async (qry) => {
            await this.recordPublished("query", qry);
            return origQry(qry);
        };
    }

    private async recordPublished(type: __PublishedType, data: any) {
        const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const document = {
            type,
            name: data?.constructor?.name ?? "Unknown",
            timestamp: new Date().toISOString(),
            payload: data,
        };

        await this._elasticsearch
            .index({ index: `cqrs-monitor-${date}`, document })
            .catch(err => this._logger.error(`Failed to index ${type}`, err));
    }
}
```

### `monitor.module.ts`

```typescript
import { Module } from "@nestjs/common";
import { ElasticsearchModule } from "@nestjs/elasticsearch";
import { ConfigService } from "@nestjs/config";
import { CqrsMonitorService } from "./cqrs.monitor.service";

@Module({
    imports: [
        ElasticsearchModule.registerAsync({
            useFactory: (config: ConfigService) => ({
                node: config.get<string>("ELASTICSEARCH_NODE", "http://localhost:9200"),
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [CqrsMonitorService],
})
export class MonitorModule {}
```

### `index.ts`

```typescript
export { MonitorModule } from "./monitor.module";
export { CqrsMonitorService } from "./cqrs.monitor.service";
```

### `app.module.ts` addition

```typescript
import { MonitorModule } from "./monitor";
// ...
imports: [
    // ... existing imports
    MonitorModule,
],
```

---

## 5. Open Questions / Decisions Needed

1. **Error tolerance**: Should a failed Elasticsearch write silently log (current plan) or throw? Silent log is safer so it doesn't break the game flow.
2. **Payload sanitization**: Raw `data` objects may contain circular refs or sensitive fields. Should we serialize with `JSON.stringify` + catch, or strip certain fields?
3. **Command interception timing**: Current plan records command *before* execution. Should it be *after* (to capture result/error too)?
4. **Query monitoring scope**: Queries might be high-frequency (e.g. every SSE poll). Should queries be sampled or filtered?
5. **Elasticsearch index lifecycle**: Should we configure ILM (Index Lifecycle Management) policies, or leave that to infra?

---

## 6. Implementation Order

1. `monitor.module.ts` — create module file
2. `cqrs.monitor.service.ts` — fill in `onModuleInit` and `recordPublished`
3. `index.ts` — add exports
4. `app.module.ts` — register MonitorModule
5. `.env` — add `ELASTICSEARCH_NODE`
