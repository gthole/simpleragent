import https = require('https');
import http = require('http');
import querystring = require('querystring');
import urlParse = require('url');
import BaseClient = require('./base-client');
import RequestError = require('./request-error');
import Response = require('./response');

const protos = {http, https},
      ports = {http: 80, https: 443};

class Request extends BaseClient implements PromiseLike<Response> {
    private _protocol: string;
    private _query: querystring.ParsedUrlQuery;
    private _params: http.ClientRequestArgs;
    private _body: string = '';

    constructor(method: string, url: string) {
        super();
        const parsed = urlParse.parse(url);

        this._protocol = (parsed.protocol || 'http:').slice(0, -1);
        this._query = querystring.parse(parsed.query);
        this._params = {
            host: parsed.hostname,
            port: parsed.port || ports[this._protocol],
            path: parsed.pathname,
            method: method,
        }
    }

    query(arg: string | {[k: string]: string | number | boolean}): Request {
        let inner: querystring.ParsedUrlQuery;
        if (typeof arg === 'string') {
            inner = querystring.parse(arg as string);
        } else {
            inner = arg as querystring.ParsedUrlQuery;
        }
        Object.keys(inner).forEach((k) => this._query[k] = inner[k]);
        return this;
    }

    send(body: string | Object): Request {
        if (typeof body === 'string') {
            this._body = body;
        } else {
            this._body = JSON.stringify(body);
            this._headers['Content-Length'] = this._body.length;
            this._headers['Content-Type'] = 'application/json';
        }
        return this;
    }

    attempt(): Promise<Response> {
        return new Promise<Response>((resolve, reject) => {
            if (Object.keys(this._query).length) {
                this._params.path += '?' + querystring.stringify(this._query);
            }
            this._params.headers = this._headers;
            const r = protos[this._protocol].request(this._params, (res) => {
                const chunks = [];
                res.on('data', (chunk) => chunks.push(chunk));
                res.on('end', () => {
                    res.text = Buffer.concat(chunks).toString();
                    try {
                        res.body = JSON.parse(res.text);
                    } catch (e) {
                        res.body = null;
                    }
                    if (res.statusCode >= 300) {
                        const rErr = new RequestError('Bad response from server.', this._params.host, this._params.path, res);
                        return reject(rErr);
                    }
                    resolve(res)
                });
            });

            if (this._body.length) r.write(this._body);
            r.on('error', (err) => {
                const rErr = new RequestError('Connection Error: ' + err.message, this._params.host, this._params.path);
                reject(rErr)
            });
            r.end();
        });
    }

    async promise(): Promise<Response> {
        let attempts = 0;
        while (true) {
            try {
                return await this.attempt();
            } catch (e) {
                if (e.statusCode >= 500 && this._retry.retries > attempts) {
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

export = Request;
