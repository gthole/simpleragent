/*
 * Light-weight HTTP client & JSON request class syntactic sugar
 */

import Client = require('./client');
import RequestError = require('./request-error');
import Request = require('./request');
import Response = require('./response');

/*
 * Helper functions
 */

function get(url: string): Request {
    return new Request('GET', url);
}

function head(url: string): Request {
    return new Request('HEAD', url);
}

function post(url: string): Request {
    return new Request('POST', url);
}

function put(url: string): Request {
    return new Request('PUT', url);
}

function patch(url: string): Request {
    return new Request('PATCH', url);
}

function del(url: string): Request {
    return new Request('DELETE', url);
}

export {
    Client,
    RequestError,
    Request,
    Response,
    get,
    head,
    post,
    put,
    patch,
    del
};

// Patch around typescript declaration file issue
exports.delete = del;
