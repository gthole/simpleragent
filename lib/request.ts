import https = require('https');
import http = require('http');
import querystring = require('querystring');
import urlParse = require('url');
import RequestError = require('./request-error');
import Response = require('./response');

const protos = {http, https},
      ports = {http: 80, https: 443};

class Request implements PromiseLike<Response> {
    private _protocol: string;
    private _query: querystring.ParsedUrlQuery;
    private _params: http.ClientRequestArgs;
    private _body: string = '';

    constructor(method: string, url: string) {
        const parsed = urlParse.parse(url);

        this._protocol = (parsed.protocol || 'http:').slice(0, -1);
        this._query = querystring.parse(parsed.query);
        this._params = {
            host: parsed.hostname,
            port: parsed.port || ports[this._protocol],
            path: parsed.pathname,
            method: method,
            headers: {
                'Accept': 'application/json'
            }
        }
    }

    auth(username: string, password: string): Request {
        const encoded = Buffer.from(username + ':' + password).toString('base64');
        this.set('Authorization', `Basic ${encoded}`);
        return this;
    }

    set(leader: string, value: string): Request;
    set(leader: {[k: string]: string | number | boolean}): Request;
    set(leader, value?): Request {
        if (typeof leader === 'string') {
            this._params.headers[leader] = value;
        } else {
            Object.keys(leader).forEach((h) => this._params.headers[h] = leader[h]);
        }
        return this;
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
            this._params.headers['Content-Length'] = this._body.length;
            this._params.headers['Content-Type'] = 'application/json';
        }
        return this;
    }

    promise(): Promise<Response> {
        return new Promise<Response>((resolve, reject) => {
            if (Object.keys(this._query).length) {
                this._params.path += '?' + querystring.stringify(this._query);
            }
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
                        const err = new RequestError(`Bad response from server. statusCode=${res.statusCode}\n${res.text}`);
                        err.status = res.statusCode;
                        err.statusCode = err.status;
                        err.response = res;
                        return reject(err);
                    }
                    resolve(res)
                });
            });

            if (this._body.length) r.write(this._body);
            r.on('error', (err) => reject(err));
            r.end();
        });
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
