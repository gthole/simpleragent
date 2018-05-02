/*
 * Light-weight HTTP client & JSON request class syntactic sugar
 */

import https = require('https');
import http = require('http');
import querystring = require('querystring');
import urlParse = require('url');

const protos = {http, https},
      ports = {http: 80, https: 443};

class Request {
    private _protocol: string;
    private _pathname: string;
    private _query: any;
    private _params: {host: string, path: string, port: number, method: string, headers: any};
    private _body: string = '';

    constructor(method: string, url: string) {
        const parsed = urlParse.parse(url);

        this._protocol = parsed.protocol.slice(0, -1);
        this._pathname = parsed.pathname;
        this._query = querystring.parse(parsed.query);

        this._params = {
            host: parsed.hostname,
            port: parsed.port || ports[this._protocol],
            path: '',
            method: method,
            headers: {
                'Accept': 'application/json'
            }
        }
    }

    auth(username: string, password: string) {
        this.set(
            'Authorization',
            'Basic ' + new Buffer(username + ':' + password).toString('base64')
        );
        return this;
    }

    set(header: string, value: string) {
        this._params.headers[header] = value;
        return this;
    }

    query(arg: any) {
        if (typeof arg === 'string') arg = querystring.parse(arg);
        Object.keys(arg).forEach((k) => this._query[k] = arg[k]);
        return this;
    }

    send(body: any) {
        this._body = JSON.stringify(body);
        this._params.headers['Content-Length'] = this._body.length;
        this._params.headers['Content-Type'] = 'application/json';
        return this;
    }

    promise(): Promise<any> {
        return new Promise((resolve, reject) => {
            this._params.path = this._pathname;
            if (Object.keys(this._query).length) {
                this._params.path += '?' + querystring.stringify(this._query);
            }
            const r = protos[this._protocol].request(this._params, (res) => {
                res.text = '';
                res.on('data', (chunk) => res.text += chunk);

                res.on('end', () => {
                    if (res.statusCode >= 400) {
                        return reject(res);
                    }
                    try {
                        res.body = JSON.parse(res.text);
                    } catch (e) {
                        res.body = null;
                    }
                    resolve(res)
                });
            });

            if (this._body.length) r.write(this._body);
            r.on('error', reject);
            r.end();
        });
    }

    then(res, rej): Promise<any> {
        return this.promise().then(res, rej);
    }

    catch(cb): Promise<any> {
        return this.promise().catch(cb);
    }

    end(done): void {
        this.promise().then((resp) => done(null, resp)).catch(done);
    }
}

export = {
    get: (url) => new Request('GET', url),
    head: (url) => new Request('HEAD', url),
    post: (url) => new Request('POST', url),
    put: (url) => new Request('PUT', url),
    patch: (url) => new Request('PATCH', url),
    delete: (url) => new Request('DELETE', url)
};
