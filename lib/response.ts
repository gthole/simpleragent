import http = require('http');

class Response extends http.IncomingMessage {
    body: any;
    text: string;
}

export = Response;
