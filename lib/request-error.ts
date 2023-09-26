import { RequestOptions } from 'https';
import { Request } from './request';
import { Response } from './response';

export class RequestError extends Error {
    status: number;
    statusCode: number;
    request: Request;
    response: Response;

    constructor(msg: string, req: Request, params: RequestOptions, res?: Response) {
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
