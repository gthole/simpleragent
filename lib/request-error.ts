import Response = require('./response');

class RequestError extends Error {
    status: number;
    statusCode: number;
    response: Response;
}

export = RequestError;
