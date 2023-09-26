import https = require('https');
import Request = require('./request');
import Response = require('./response');

class RequestError extends Error {
    status: number;
    statusCode: number;
    request: Request;
    response: Response;

    constructor(msg: string, req: Request, params: https.RequestOptions, res?: Response) {
        const attrs = [
            `method=${params.method}`,
            `host=${params.host}`,
            `path=${params.path}`,
            `status=${res ? res.statusCode : 'none'}`,
        ];
        const m = `${msg} ${attrs.join(' ')}${ res ? '\n' + res.text : '' }`;
        super(m);

        this.request = req;
        if (res) {
            this.status = res.statusCode;
            this.statusCode = this.status;
            this.response = res;
        }
    }
}

export = RequestError;
