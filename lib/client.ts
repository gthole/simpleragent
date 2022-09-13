import Request = require('./request');
import BaseClient = require('./base-client');

class Client extends BaseClient {
    private _prefix: string;
    private _cert: string;
    private _key: string;

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

    cert(certstr: string) {
        this._cert = certstr;
        return this;
    }

    key(keystr: string) {
        this._key = keystr;
        return this;
    }

    private build(method, path): Request {
        const req = new Request(method, this._prefix + (path || ''))
            .set(this._headers)
            .retry(this._retry)
            .timeout(this._timeout);

        // Pass through TLS options
        if (this._cert) req.cert(this._cert);
        if (this._key) req.key(this._key);

        return req;
    }
}

export = Client;
