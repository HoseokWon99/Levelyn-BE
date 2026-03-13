import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { CommandBus } from '@nestjs/cqrs';
import { CqrsModuleOptions, ICommand } from '@nestjs/cqrs/dist/interfaces';
import { MonitoringService } from './monitoring.service';

@Injectable()
export class MonitoredCommandBus extends CommandBus {
    constructor(
        moduleRef: ModuleRef,
        private readonly _monitoring: MonitoringService,
        options?: CqrsModuleOptions,
    ) {
        super(moduleRef, options);
    }

    async execute<T extends ICommand, R = any>(command: T, ...args: any[]): Promise<R> {
        const name = command.constructor.name;
        const start = Date.now();
        let failed = false;
        try {
            const result = await super.execute<T, R>(command, ...args);
            return result;
        } catch (err) {
            failed = true;
            throw err;
        } finally {
            this._monitoring.recordCommand(name, Date.now() - start, failed);
        }
    }
}
