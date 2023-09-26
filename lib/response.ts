import { IncomingMessage } from 'http';

export class Response extends IncomingMessage {
    body: any;
    text: string;
}
