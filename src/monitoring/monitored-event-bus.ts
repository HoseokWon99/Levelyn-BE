import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { CommandBus, EventBus } from '@nestjs/cqrs';
import { CqrsModuleOptions } from '@nestjs/cqrs/dist/interfaces';
import { IEvent } from '@nestjs/cqrs/dist/interfaces';
import { UnhandledExceptionBus } from '@nestjs/cqrs/dist/unhandled-exception-bus';
import { MonitoringService } from './monitoring.service';

@Injectable()
export class MonitoredEventBus extends EventBus {
    constructor(
        commandBus: CommandBus,
        moduleRef: ModuleRef,
        unhandledExceptionBus: UnhandledExceptionBus,
        private readonly _monitoring: MonitoringService,
        options?: CqrsModuleOptions,
    ) {
        super(commandBus, moduleRef, unhandledExceptionBus, options);
    }

    publish<T extends IEvent>(event: T): any {
        const name = event.constructor.name;
        const start = Date.now();
        let failed = false;
        try {
            const result = super.publish(event);
            return result;
        } catch (err) {
            failed = true;
            throw err;
        } finally {
            this._monitoring.recordEvent(name, Date.now() - start, failed);
        }
    }
}
