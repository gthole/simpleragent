import { Request } from '../request';
import { IPlugin } from './base';

export function timeout(ttl: number) {
    class TimeoutPlugin implements IPlugin {
        timer: any;

        async onRequest(req): Promise<void> {
            this.timer = setTimeout(() => req.abort(), ttl);
        }

        async onResponse(req, res) {
            clearTimeout(this.timer);
        }

        async onError(req, res) {
            clearTimeout(this.timer);
        }
    }
    return TimeoutPlugin;
}
