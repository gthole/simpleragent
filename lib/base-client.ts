import { IPlugin } from './plugins/base';
import { redirect } from './plugins/redirect';
import { retry, IRetryPolicy } from './plugins/retry';
import { timeout } from './plugins/timeout';

export class BaseClient {
    protected _headers: {[k: string]: string | number | string[]} = {};
    protected _plugins: (new () => IPlugin)[] = [];

    auth(username: string, password: string): this {
        const encoded = Buffer.from(username + ':' + password).toString('base64');
        this.set('Authorization', `Basic ${encoded}`);
        return this;
    }

    set(leader: string, value: string): this;
    set(leader: {[k: string]: string | number | string[]}): this;
    set(leader, value?): this {
        if (typeof leader === 'string') {
            this._headers[leader] = value;
        } else {
            Object.keys(leader).forEach((h) => this._headers[h] = leader[h]);
        }
        return this;
    }

    use(plugin: new () => IPlugin): this {
        this._plugins.push(plugin);
        return this;
    }

    timeout(ttl: number): this {
        this.use(timeout(ttl));
        return this;
    }

    retry(policy: number): this;
    retry(policy: IRetryPolicy): this;
    retry(policy): this {
        if (typeof policy === 'number') {
            this.use(retry({retries: policy}));
        } else {
            this.use(retry(policy));
        }
        return this;
    }

    redirects(max_redirects: number): this {
        this.use(redirect(max_redirects));
        return this;
    }
}
