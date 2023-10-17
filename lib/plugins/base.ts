import { Request } from '../request';
import { Response } from '../response';
import { RequestError } from '../request-error';

export interface IPluginResult {
    retry: boolean;
}

export interface IPlugin {
    onRequest?: (req: Request) => Promise<void>;
    onResponse?: (req: Request, res: Response) => Promise<void|IPluginResult>;
    onError?: (req: Request, err: RequestError) => Promise<void|IPluginResult>;
}
