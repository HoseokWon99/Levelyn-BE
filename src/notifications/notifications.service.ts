import { Inject, Injectable, Logger } from "@nestjs/common";
import Redis from "ioredis";
import { NOTIFICATION_BLOCK_TIMEOUT, NOTIFICATION_LOOP_DELAY, STREAM_MAX_LENGTH } from "./token";
import { from, Observable } from "rxjs";
import { UserEvent } from "../common";
import { Notification } from "./notification";

@Injectable()
export class NotificationsService {
    private readonly _logger: Logger = new Logger(NotificationsService.name);

    constructor(
       @Inject(Redis)
       private readonly _redis: Redis,
       @Inject(NOTIFICATION_BLOCK_TIMEOUT)
       private readonly _timeout: number,
       @Inject(STREAM_MAX_LENGTH)
       private readonly _maxLength: number,
       @Inject(NOTIFICATION_LOOP_DELAY)
       private readonly _loopDelay: number,
    ) {}

    async addUserEvent(event: UserEvent): Promise<string> {
        const streamId = await this._redis.xadd(
            __makeStreamKey(event.userId),
            "MAXLEN", "~", this._maxLength,
            "*",
            "data", JSON.stringify(event),
        );
        if (!streamId) throw Error(`Failed to add notification ${event}`);
        this._logger.debug(`Added to stream ${streamId}`);
        return streamId;
    }

    getUserNotifications(userId: number, lastId?: string): Observable<Notification> {
       return from(this.generateFromStream(__makeStreamKey(userId), lastId ?? "$"));
    }

    private async* generateFromStream(
        streamKey: string,
        offsetId: string,
    ): AsyncIterableIterator<Notification> {
        // Step 1: Catch up on missed messages (if reconnecting)
        if (offsetId !== "$") {
            this._logger.debug(`Catching up from ${offsetId}`);

            const missed = await this._redis.xrange(
                streamKey,
                offsetId,
                "+",
                "COUNT", 100,
            );

           if (missed.length) {
               yield* missed.map(__parseNotification);
               offsetId = missed.at(-1)!![0];
           }
        }

        // Step 2: Stream new messages with blocking read
        while (true) {
            try {
                const result = await this._redis.xread(
                    "BLOCK", this._timeout,
                    "STREAMS", streamKey,
                   offsetId,
                );

                if (!result || result.length === 0) continue; // Timeout, no messages - continue loop
                const [_, messages] = result[0];

                if (messages.length) {
                    yield *messages.map(__parseNotification);
                    offsetId = messages.at(-1)!![0];
                }
            }
            catch (err) {
                this._logger.error(`XREAD error: ${err.message}`, err.stack);
            }
            finally {
                await new Promise(resolve => setTimeout(resolve, this._loopDelay));
            }
        }
    }
}

function __makeStreamKey(userId: number): string {
    return `user:${userId}:stream`;
}

const __fieldNames = ["topic", "data"];

function __parseNotification([id, fields]: [id: string, fields: string[]]): Notification {
    const [topic, data] = __fieldNames.map(v => fields[fields.indexOf(v) + 1]);
    return new Notification(id, topic, JSON.parse(data));
}

