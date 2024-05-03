import { request, RequestOptions } from 'https';
import { request as httpRequest } from 'http';
import { ParsedUrlQuery, parse, stringify } from 'querystring';
import { parse as urlParse } from 'url';
import { Writable, pipeline } from 'stream';
import { createBrotliDecompress, createUnzip } from 'zlib';
import { IPlugin } from './plugins/base';
import { BaseClient } from './base-client';
import { RequestError, AbortError, ConnectionError } from './request-error';
import { Response } from './response';

const protos = {http: httpRequest, https: request},
      ports = {http: 80, https: 443};

export class Request extends BaseClient implements PromiseLike<Response> {
    public abort: () => void;
    private _protocol: string;
    private _query: ParsedUrlQuery;
    private _body: string = '';
    private _params: RequestOptions;
    private _pluginInstances: IPlugin[];

    constructor(method: string, url: string) {
        super();
        const parsed = urlParse(url);

        this._params = {method};
        this.location(url);
        this._headers['Accept'] = 'application/json';
        this._headers['Accept-Encoding'] = 'gzip, deflate, br';
    }

    get method() {
        return this._params.method;
    }

    get path() {
        return this._params.path;
    }

    get host() {
        return this._params.host;
    }

    get querystring() {
        return stringify({...this._query});
    }

    location(url: string): this {
        const parsed = urlParse(url);
        this._protocol = (parsed.protocol || 'http:').slice(0, -1);
        this._query = parse(parsed.query);
        this._params.host = parsed.hostname;
        this._params.port = parsed.port || ports[this._protocol];
        this._params.path = parsed.pathname;
        return this;
    }

    query(arg: string | {[k: string]: string | number | boolean}): Request {
        let inner: ParsedUrlQuery;
        if (typeof arg === 'string') {
            inner = parse(arg as string);
        } else {
            inner = arg as ParsedUrlQuery;
        }
        Object.keys(inner).forEach((k) => this._query[k] = inner[k]);
        return this;
    }

    cert(certstr: string | Buffer) {
        this._params.cert = certstr;
        return this;
    }

    key(keystr: string | Buffer) {
        this._params.key = keystr;
        return this;
    }

    ca(castrs: Array<string | Buffer>) {
        this._params.ca = castrs;
        return this;
    }

    send(body: string | Object): Request {
        if (typeof body === 'string') {
            this._body = body;
        } else {
            this._body = JSON.stringify(body);
            this._headers['Content-Type'] = 'application/json';
        }
        this._headers['Content-Length'] = Buffer.byteLength(this._body);
        return this;
    }

    attempt(): Promise<Response> {
        let req;
        const params = {...this._params};
        if (Object.keys(this._query).length) {
            params.path += '?' + stringify({...this._query});
        }
        params.headers = {...this._headers};
        return new Promise<Response>((resolve, reject) => {
            let res;
            req = protos[this._protocol](params, (response) => {
                res = response;
                res.text = '';
                const output = new Writable();
                const onError = (err) => {
                    if (err) console.log(err);
                    output.end();
                }
                output._write = (chunk, encoding, next) => {
                    res.text += chunk.toString();
                    next();
                }

                output.on('close', () => {
                    try {
                        res.body = JSON.parse(res.text);
                    } catch (e) {
                        res.body = null;
                    }
                    if (res.statusCode >= 300) {
                        const rErr = new RequestError('Bad response from server.', this, params, res);
                        return reject(rErr);
                    }
                    resolve(res)
                });

                switch (res.headers['content-encoding']) {
                    case 'br':
                      pipeline(res, createBrotliDecompress(), output, onError);
                      break;
                    case 'gzip':
                    case 'deflate':
                      pipeline(res, createUnzip(), output, onError);
                      break;
                    default:
                      pipeline(res, output, onError);
                      break;
                }
            });

            if (this._body.length) req.write(this._body);
            req.on('error', (err) => {
                const rErr = new ConnectionError('Connection Error: ' + err.message, this, params);
                reject(rErr)
            });

            this.abort = () => req.abort();
            req.on('abort', () => {
                const rErr = new AbortError(`Request was aborted`, this, params);
                reject(rErr);
            });

            req.end();
        });
    }

    async promise(): Promise<Response> {
        while (true) {
            await this.runPlugins('onRequest');
            try {
                const res: Response = await this.attempt();
                const pres = await this.runPlugins('onResponse', res);
                if (pres?.retry) {
                    continue;
                }
                return res;
            } catch (err) {
                const pres = await this.runPlugins('onError', err);
                if (pres?.retry) {
                    continue;
                }
                throw err;
            }
        }
    }

    private async runPlugins(name: string, ...args) {
        if (!this._pluginInstances) this._pluginInstances = this._plugins.map(pc => new pc());
        const plugins = this._pluginInstances.filter(p => Boolean(p[name]));
        let result;
        for (const plugin of plugins) {
            const pres = await plugin[name](this, ...args);
            if (pres?.retry) {
                result = pres;
            }
        }
        return result;
    }

    /*
     * Promise-like functions
     */

    then(resolve: ((value: Response) => void) | undefined | null, reject: ((err: RequestError) => void) | undefined | null): Promise<any> {
        return this.promise().then(resolve, reject);
    }

    catch(cb): Promise<RequestError | Response> {
        return this.promise().catch(cb);
    }

    finally(cb): Promise<RequestError | Response> {
        return this.promise().finally(cb);
    }

    /*
     * Callback support
     */

    end(done: (err: RequestError, res?: Response) => void): void {
        this.then(
            (res: Response) => done(null, res),
            (err: RequestError) => done(err)
        );
    }
}
