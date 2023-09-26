import { Request } from './request';
import { BaseClient } from './base-client';

export class Client extends BaseClient {
    private _prefix: string;
    private _cert: string | Buffer;
    private _key: string | Buffer;
    private _ca: Array<string | Buffer>;

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

    cert(certstr: string | Buffer) {
        this._cert = certstr;
        return this;
    }

    key(keystr: string | Buffer) {
        this._key = keystr;
        return this;
    }

    ca(castrs: Array<string | Buffer>) {
        this._ca = castrs;
        return this;
    }

    private build(method, path): Request {
        const req = new Request(method, this._prefix + (path || ''))
            .set(this._headers)
            .retry(this._retry)
            .timeout(this._ttl);

        // Pass through TLS options
        if (this._cert) req.cert(this._cert);
        if (this._key) req.key(this._key);
        if (this._ca) req.ca(this._ca);

        return req;
    }
}
