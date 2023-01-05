# SimplerAgent
A NodeJS simplified version of [SuperAgent.js](http://visionmedia.github.io/superagent/)
for making JSON HTTP requests.

## Why?
Superagent is great!  It lets you structure your requests cleanly and programmatically.

But it's also pretty heavy - it contains lots of features that aren't necessary
for making simple JSON requests, which are most of the requests I make most of
the time.  If I'm bundling up a small Lambda function, it's better to have a
super small library to provide the same functionality without all the extra
stuff.

## SimplerAgent
- Can probably do most of what you need for API requests
- Automatically requests and parses JSON
- Automatically requests and decodes gzip/brotli responses
- Handles retry logic and timeout aborts
- Only uses standard libraries, no production dependencies
- Is small: roughly 300 lines of code
- Is typed with Typescript
- Has good test coverage

## Installation

Easy enough:

```bash
$ npm install --save simpleragent
```

## What's Supported?
SimplerAgent is intended to be used for basic JSON requests.

Calls return a `Promise-like` object that plays well with `async`/`await`.

### Importing
Import with require:

```javascript
const { request, Response } = require('simpleragent');
const request = require('simpleragent');
```
or with `import` in Typescript
```
import { request, Response, ResponseError } from 'simpleragent';
import { get, put } from 'simpleragent';
```

### Making Requests
Requests are Promises-first and can be await'ed:
```javascript
const resp = await request.get('https://www.example.com')
    .auth('my-user', 'pass')
    .query({name: 'bananas'});

// The response body string is available in the "text" attribute of
// the response.
console.log(resp.text);

// The "body" attribute contains the JSON-parsed body (or null if
// parsing failed).
console.log(resp.body);
```

You can also use callbacks with the `end` method:

```javascript
request.get('http://www.example.com').end((err, resp) => ... );
```

### Sending Payloads

Drop JSON into the `send` method. Don't worry about setting the Content-Type,
it's set to `application/json` for you.

```
// Sending JSON bodies, HTTPS, and setting headers, using callbacks
await request
    .post('https://api.example.com/v1/fruit')
    .set('Authorization', 'Bearer ' + myApiKey)
    .send({name: 'banana', type: 'peel'});
```

### Error Handling

Errors are thrown for non-2xx responses, with the status code and response
object on the thrown error

```
try {
    const resp = await request.get('http://www.example.com/return-400');
} catch (e) {
    console.log(e.statusCode);
    console.log(e.response.body);
}
```

### Retrying
Simpleragent will auto-retry 5xx errors if you set a `retry` policy.

```javascript
// A simple policy to retry 5xx errors five times
const resp = await request
    .get('http://www.example.com/return-500')
    .retry(5);

// A policy with optional delay and optional exponential backoff
try {
    await request
        .get('http://www.example.com/return-503')
        .retry({retries: 3, delay: 100, backoff: 2});
} catch (e) {
    // 5xx errors are thrown if retries are exhausted
    // 4xx errors are thrown without retrying
    console.log(e.statusCode);
}
```

`delay` is the number of milliseconds to wait between retries, and `backoff` is
a multiplicative factor to apply to the `delay` with each retry.

### Timeouts
Simpleragent can abort requests that do not complete within a certain period of
time.

```javascript
// Set a 5 second timeout, which takes a milliseconds argument
try {
    await request
        .get('http://www.example.com/delay-10-seconds')
        .timeout(5000);
} catch (e) {
    // An error message indicates the timeout
    console.log(e.message);
}
```

### Client Certificates

```javascript
// Send a client certificate
await request
    .get('https://my-mtls-endpoint.com/foo')
    .cert(fs.readFileSync('agent-cert.pem'))
    .key(fs.readFileSync('agent-key.pem'));
```

### Methods Supported

- `get`
- `head`
- `post`
- `put`
- `patch`
- `del`

## Client Objects
Clients reduce the overall boilerplate required for each request.  If you have
a client that makes multiple calls to an API, you can omit the base url and
headers.

The Client constructor takes a path prefix as an argument. You can add or update
headers with the `set` method. Then use the client as you would `simpleragent`,
but without all the extra code.

```javascript
import { Client } from 'simpleragent';

const client = new request.Client('https://www.example.com/api/v1');

// Set a header to be sent with all requests
client.set('x-api-key', process.env.SOME_API_KEY);

// Add a basic auth Authorization header
client.auth(username, password);

// Set a retry policy that will be applied to all requests
client.retry({retries: 3, delay: 200});

async function get() {
    const resp = await client.get('/resource').query({foo: 'bar'});
    return resp.body;
}

async function post(payload) {
    const resp = await client.post('/resource').send(payload);
    return resp.body.id;
}
```

`Client` instances also support the `cert` and `key` options for client TLS.

## What Isn't Supported?
Everything else.

**Features that are left out:**
- Content-Types besides JSON: no `type`, `accept` or `serialize` methods.
- Piping response data: Data loaded directly into memory
- Sessions: Cookies not saved
- Progress Tracking: Don't use it for big uploads
- Browser version: Node only
- Following Redirects
- Plugins, etc.
