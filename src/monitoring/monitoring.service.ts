import { Injectable } from '@nestjs/common';

interface EventRecord {
    count: number;
    failures: number;
    totalLatencyMs: number;
}

interface SseConnectionRecord {
    connectedAt: Date;
    endpoint: string;
}

export interface MonitoringSnapshot {
    events: Record<string, { count: number; failures: number; avgLatencyMs: number }>;
    commands: Record<string, { count: number; failures: number; avgLatencyMs: number }>;
    sse: {
        activeConnections: number;
        connections: Array<{ userId: number; endpoint: string; connectedAt: string }>;
        notificationsSent: number;
    };
    capturedAt: string;
}

@Injectable()
export class MonitoringService {
    private readonly events = new Map<string, EventRecord>();
    private readonly commands = new Map<string, EventRecord>();
    private readonly sseConnections = new Map<number, SseConnectionRecord>();
    private notificationsSent = 0;

    recordEvent(name: string, latencyMs: number, failed: boolean): void {
        const record = this.events.get(name) ?? { count: 0, failures: 0, totalLatencyMs: 0 };
        record.count++;
        record.totalLatencyMs += latencyMs;
        if (failed) record.failures++;
        this.events.set(name, record);
    }

    recordCommand(name: string, latencyMs: number, failed: boolean): void {
        const record = this.commands.get(name) ?? { count: 0, failures: 0, totalLatencyMs: 0 };
        record.count++;
        record.totalLatencyMs += latencyMs;
        if (failed) record.failures++;
        this.commands.set(name, record);
    }

    registerSseConnection(userId: number, endpoint: string): void {
        this.sseConnections.set(userId, { connectedAt: new Date(), endpoint });
    }

    unregisterSseConnection(userId: number): void {
        this.sseConnections.delete(userId);
    }

    recordNotificationSent(): void {
        this.notificationsSent++;
    }

    getSnapshot(): MonitoringSnapshot {
        const toSummary = (map: Map<string, EventRecord>) => {
            const result: Record<string, { count: number; failures: number; avgLatencyMs: number }> = {};
            for (const [name, rec] of map.entries()) {
                result[name] = {
                    count: rec.count,
                    failures: rec.failures,
                    avgLatencyMs: rec.count > 0 ? Math.round(rec.totalLatencyMs / rec.count) : 0,
                };
            }
            return result;
        };

        const connections = Array.from(this.sseConnections.entries()).map(([userId, rec]) => ({
            userId,
            endpoint: rec.endpoint,
            connectedAt: rec.connectedAt.toISOString(),
        }));

        return {
            events: toSummary(this.events),
            commands: toSummary(this.commands),
            sse: {
                activeConnections: this.sseConnections.size,
                connections,
                notificationsSent: this.notificationsSent,
            },
            capturedAt: new Date().toISOString(),
        };
    }
}
