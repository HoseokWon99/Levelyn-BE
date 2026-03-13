import { Module } from "@nestjs/common";
import { ElasticsearchModule } from "@nestjs/elasticsearch";
import { ConfigService } from "@nestjs/config";
import { CqrsMonitorService } from "./cqrs.monitor.service";

@Module({
    imports: [
        ElasticsearchModule.registerAsync({
            useFactory: (config: ConfigService) => ({
                node: config.get<string>("ELASTICSEARCH_NODE")!!,
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [CqrsMonitorService],
})
export class MonitorModule {}