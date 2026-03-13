import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { NOTIFICATION_BLOCK_TIMEOUT, NOTIFICATION_LOOP_DELAY, STREAM_MAX_LENGTH } from './token';
import { UserEvent } from '../common';
import { firstValueFrom, take, toArray } from 'rxjs';


describe('NotificationsService', () => {
    let service: NotificationsService;
    let redisMock: Partial<Redis>;

    beforeEach(async () => {
        redisMock = {
            xadd: jest.fn().mockResolvedValue('1678901234567-0'),
            xread: jest.fn(),
            xrange: jest.fn().mockResolvedValue([])
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NotificationsService,
                { provide: Redis, useValue: redisMock },
                { provide: NOTIFICATION_BLOCK_TIMEOUT, useValue: 10 },
                { provide: STREAM_MAX_LENGTH, useValue: 500 },
                { provide: NOTIFICATION_LOOP_DELAY, useValue: 0 },
            ],
        }).compile();

        service = module.get<NotificationsService>(NotificationsService);
        jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should add a user event to stream', async () => {
        const event = new UserEvent(1, 'event', {});

        const streamId = await service.addUserEvent(event);

        expect(streamId).toBe('1678901234567-0');
        expect(redisMock.xadd).toHaveBeenCalledWith(
            'user:1:stream',
            'MAXLEN', '~', 500,
            '*',
            'data', JSON.stringify(event)
        );
    });

    it('should stream notifications from Redis Streams', async () => {
        const data = { message: 'Hi' };
        const mockEntry = ['1678901234567-0', ['topic', 'info', 'data', JSON.stringify(data)]];

        redisMock.xread = jest.fn()
            .mockResolvedValueOnce([
                ['user:1:stream', [mockEntry]]
            ])
            .mockResolvedValue(null);

        const observable = service.getUserNotifications(1);
        const result = await firstValueFrom(observable);

        expect(result).toMatchObject({ id: '1678901234567-0', event: 'info', data });
        expect(redisMock.xread).toHaveBeenCalledWith(
            'BLOCK', 10,
            'STREAMS', 'user:1:stream', '$'
        );
    });

    it('should catch up on missed messages when reconnecting', async () => {
        const entry1 = ['1000-0', ['topic', 'event1', 'data', JSON.stringify({ v: 1 })]];
        const entry2 = ['1001-0', ['topic', 'event2', 'data', JSON.stringify({ v: 2 })]];

        redisMock.xrange = jest.fn().mockResolvedValue([entry1, entry2]);
        redisMock.xread = jest.fn().mockResolvedValue(null);

        const observable = service.getUserNotifications(1, '999-0');
        const results = await observable.pipe(take(2), toArray()).toPromise();

        expect(results).toHaveLength(2);
        expect(results![0]).toMatchObject({ id: '1000-0', event: 'event1', data: { v: 1 } });
        expect(results![1]).toMatchObject({ id: '1001-0', event: 'event2', data: { v: 2 } });

        expect(redisMock.xrange).toHaveBeenCalledWith(
            'user:1:stream',
            '999-0',
            '+',
            'COUNT', 100
        );
    });
});