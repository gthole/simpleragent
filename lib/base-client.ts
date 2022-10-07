interface IRetryPolicy {
    retries: number;
    delay?: number;
    backoff?: number;
}

class BaseClient {
    protected _headers: {[k: string]: string | number | string[]} = {};
    protected _retry: IRetryPolicy = {retries: 0};
    protected _ttl: number;

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

    timeout(ttl: number): this {
        this._ttl = ttl;
        return this;
    }

    retry(policy: number): this;
    retry(policy: IRetryPolicy): this;
    retry(policy): this {
        if (typeof policy === 'number') {
            this._retry = {retries: policy};
        } else {
            this._retry = policy;
        }
        return this;
    }
}

export = BaseClient;
