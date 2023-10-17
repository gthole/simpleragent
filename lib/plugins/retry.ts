import { IPlugin } from './base';

export interface IRetryPolicy {
    retries: number;
    delay?: number;
    backoff?: number;
}

export function retry(policy: IRetryPolicy) {
    class RetryPlugin implements IPlugin {
        attempts = 0;

        async onError(req, err) {
            if ((err.statusCode >= 500 || !err.statusCode) && policy.retries > this.attempts) {
                this.attempts += 1;
                if (policy.delay) {
                    let wait = policy.delay;
                    if (policy.backoff) {
                        wait *= policy.backoff ** (this.attempts - 1);
                    }
                    await new Promise(r => setTimeout(r, wait));
                }
                return {retry: true};
            }
        }
    }
    return RetryPlugin;
}
