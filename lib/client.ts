import Request = require('./request');
import BaseClient = require('./base-client');

class Client extends BaseClient {
    private _prefix: string;

    constructor(prefix: string, headers?: {[k: string]: string | number | string[]}) {
        super();
        this._prefix = prefix;
        if (headers) this.set(headers);
    }

    get(path?: string): Request {
        return this.build('GET', path);
    }

    head(path?: string): Request {
        return this.build('HEAD', path);
    }

    post(path?: string): Request {
        return this.build('POST', path);
    }

    put(path?: string): Request {
        return this.build('PUT', path);
    }

    patch(path?: string): Request {
        return this.build('PATCH', path);
    }

    delete(path?: string): Request {
        return this.build('DELETE', path);
    }

    del(path?: string): Request {
        return this.build('DELETE', path);
    }

    private build(method, path): Request {
        return new Request(method, this._prefix + (path || ''))
            .set(this._headers)
            .retry(this._retry);
    }
}

export = Client;
