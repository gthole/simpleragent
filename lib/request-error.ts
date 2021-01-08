import Response = require('./response');

class RequestError extends Error {
    status: number;
    statusCode: number;
    response: Response;

    constructor(msg: string, host: string, path: string, res?: Response) {
        const attrs = [
            `host=${host}`,
            `path=${path}`,
            `status=${res ? res.statusCode : 'none'}`,
        ];
        const m = `${msg} ${attrs.join(' ')}${ res ? '\n' + res.text : '' }`;
        super(m);

        if (res) {
            this.status = res.statusCode;
            this.statusCode = this.status;
            this.response = res;
        }
    }
}

export = RequestError;
