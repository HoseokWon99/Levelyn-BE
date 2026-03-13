import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { CommandBus, EventBus, QueryBus } from "@nestjs/cqrs";
import { ElasticsearchService } from "@nestjs/elasticsearch";

type PublishedType = "event" | "command" | "query";
const ES_INDEX = "cqrs_monitor";

interface MonitorDocument {
    type: PublishedType;
    name: string;
    payload: unknown;
    timestamp: string;
}

@Injectable()
export class CqrsMonitorService implements OnModuleInit {
    private readonly _logger = new Logger(CqrsMonitorService.name);

    constructor(
        @Inject(ElasticsearchService)
        private readonly _elasticsearch: ElasticsearchService,
        @Inject(EventBus)
        private readonly _eventBus: EventBus,
        @Inject(CommandBus)
        private readonly _commandBus: CommandBus,
        @Inject(QueryBus)
        private readonly _queryBus: QueryBus,
    ) {}

    onModuleInit() {
        this._eventBus.subscribe(event =>
            this.recordPublished("event", event),
        );

        const origCmd = this._commandBus.execute.bind(this._commandBus);
        this._commandBus.execute = async (cmd) => {
            await this.recordPublished("command", cmd);
            return origCmd(cmd);
        };

        const origQry = this._queryBus.execute.bind(this._queryBus);
        this._queryBus.execute = async (qry) => {
            await this.recordPublished("query", qry);
            return origQry(qry);
        };
    }

    private async recordPublished(type: PublishedType, data: any): Promise<void> {
        const document: MonitorDocument = {
            type,
            name: data?.constructor?.name ?? "Unknown",
            timestamp: new Date().toISOString(),
            payload: data,
        };

        await this._elasticsearch
            .index({ index: ES_INDEX, document })
            .catch(err => this._logger.error(`Failed to index ${type}`, err));
    }
}