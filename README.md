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
- Has no production dependencies
- Is small: roughly 150 lines of code
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

```javascript
const request = require('simpleragent');

// Promises first, within an async function
// Easily set headers and query parameters
const resp = await request
    .get('http://www.example.com')
    .auth('my-user', 'pass')
    .query({name: 'bananas'});

// The response body string is available in the "text" attribute of
// the response.
console.log(resp.text);

// The "body" attribute contains the JSON-parsed body (or null if
// parsing failed).
console.log(resp.body);

// Sending JSON bodies, HTTPS, and setting headers, using callbacks
request
    .post('https://api.example.com/v1/fruit')
    .set('Authorization', 'Bearer ' + myApiKey)
    .send({name: 'banana', type: 'peel'})
    .end((end, resp) => {
        // Do something
    });

// Errors are thrown for non-2xx responses, with the status code
// and response object on the thrown error
try {
    const resp = await request.get('http://www.example.com/return-400');
} catch (e) {
    console.log(e.statusCode);
    console.log(e.response.body);
}
```

Methods supported:
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
client.set('Authorization', 'Bearer ' + process.env.SOME_API_KEY);

async function get() {
    const resp = await client.get('/resource').query({foo: 'bar'});
    return resp.body;
}

async function post(payload) {
    const resp = await client.post('/resource').send(payload);
    return resp.body.id;
}
```

## What Isn't Supported?
Everything else.

**Features that are left out:**
- Content-Types besides JSON: no `type`, `accept` or `serialize` methods.
- Piping response data: Data loaded directly into memory
- Sessions: Cookies not saved
- Progress Tracking: Don't use it for big uploads
- Browser version: Node only
- Retrying request: Do that manually if you want it
- TLS options: Maybe will add these later
- Aborts / Timeouts
- Following Redirects
- Plugins, etc.
