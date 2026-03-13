
export class Notification {
    constructor(
        readonly id: string,
        readonly event: string,
        readonly data: any,
    ) {}
}