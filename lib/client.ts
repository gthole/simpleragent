import Request = require('./request');

class Client {
    prefix: string;
    headers: {[k: string]: string | number | boolean};

    constructor(prefix: string, headers?: {[k: string]: string | number | boolean}) {
        this.prefix = prefix;
        this.headers = headers || {};
    }

    get(path?: string): Request {
        return new Request('GET', this.prefix + (path || '')).set(this.headers);
    }

    head(path?: string): Request {
        return new Request('HEAD', this.prefix + (path || '')).set(this.headers);
    }

    post(path?: string): Request {
        return new Request('POST', this.prefix + (path || '')).set(this.headers);
    }

    put(path?: string): Request {
        return new Request('PUT', this.prefix + (path || '')).set(this.headers);
    }

    patch(path?: string): Request {
        return new Request('PATCH', this.prefix + (path || '')).set(this.headers);
    }

    delete(path?: string): Request {
        return new Request('DELETE', this.prefix + (path || '')).set(this.headers);
    }

    del(path?: string): Request {
        return this.delete(path);
    }
}

export = Client;
