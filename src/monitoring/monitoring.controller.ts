import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MonitoringService, MonitoringSnapshot } from './monitoring.service';

@ApiTags('Monitoring')
@Controller('/api/monitoring')
export class MonitoringController {
    constructor(
        @Inject(MonitoringService)
        private readonly _monitoring: MonitoringService,
    ) {}

    @Get('/')
    @ApiOperation({ summary: '모니터링 스냅샷 조회' })
    @ApiOkResponse({ description: 'CQRS 이벤트/커맨드 및 SSE 연결 현황' })
    getSnapshot(): MonitoringSnapshot {
        return this._monitoring.getSnapshot();
    }
}
