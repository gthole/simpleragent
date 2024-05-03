import { Request } from './request';

/*
 * Core classes
 */

export { Client } from './client';
export { RequestError, AbortError, ConnectionError } from './request-error';
export { Request } from './request';
export { Response } from './response';
export { IPluginResult, IPlugin } from './plugins/base';

/*
 * Helper functions
 */

export function get(url: string): Request {
    return new Request('GET', url);
}

export function head(url: string): Request {
    return new Request('HEAD', url);
}

export function post(url: string): Request {
    return new Request('POST', url);
}

export function put(url: string): Request {
    return new Request('PUT', url);
}

export function patch(url: string): Request {
    return new Request('PATCH', url);
}

export function del(url: string): Request {
    return new Request('DELETE', url);
}

export const request = {get, head, post, put, patch, del, delete: del};

// Patch around typescript declaration file issue
exports.delete = del;
