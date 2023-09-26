import { request, RequestOptions } from 'https';
import { request as httpRequest } from 'http';
import { createBrotliDecompress, createUnzip } from 'zlib';
import { ParsedUrlQuery, parse, stringify } from 'querystring';
import { parse as urlParse } from 'url';
import { Writable, pipeline } from 'stream';
import { BaseClient } from './base-client';
import { RequestError } from './request-error';
import { Response } from './response';

const protos = {http: httpRequest, https: request},
      ports = {http: 80, https: 443};

export class Request extends BaseClient implements PromiseLike<Response> {
    private _protocol: string;
    private _query: ParsedUrlQuery;
    private _body: string = '';
    private _params: RequestOptions;

    constructor(method: string, url: string) {
        super();
        const parsed = urlParse(url);

        this._protocol = (parsed.protocol || 'http:').slice(0, -1);
        this._query = parse(parsed.query);
        this._params = {
            host: parsed.hostname,
            port: parsed.port || ports[this._protocol],
            path: parsed.pathname,
            method: method,
        }
        this._headers['Accept'] = 'application/json';
        this._headers['Accept-Encoding'] = 'gzip, deflate, br';
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
        const promise = new Promise<Response>((resolve, reject) => {
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
                const rErr = new RequestError('Connection Error: ' + err.message, this, params);
                reject(rErr)
            });

            req.on('abort', () => {
                const rErr = new RequestError(`Request was aborted`, this, params);
                reject(rErr);
            });

            req.end();
        });

        if (this._ttl) {
            return Promise.race([
                promise,
                new Promise((_, r) => {
                    setTimeout(
                        () => {
                            req.abort();
                            const error = new RequestError('Request timed out', this, params);
                            r(error);
                        },
                        this._ttl
                    )
                })
            ]) as Promise<Response>;
        } else {
            return promise;
        }
    }

    async promise(): Promise<Response> {
        let attempts = 0;
        while (true) {
            try {
                return await this.attempt();
            } catch (e) {
                if ((e.statusCode >= 500 || !e.statusCode) && this._retry.retries > attempts) {
                    attempts += 1;
                    if (this._retry.delay) {
                        let wait = this._retry.delay;
                        if (this._retry.backoff) {
                            wait *= this._retry.backoff ** (attempts - 1);
                        }
                        await new Promise(r => setTimeout(r, wait));
                    }
                } else {
                    throw e;
                }
            }
        }
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
