# SimplerAgent
A NodeJS simplified version of [SuperAgent.js](http://visionmedia.github.io/superagent/)
for making JSON HTTP requests.

### Why?
Superagent is great!  It lets you structure your requests cleanly and programmatically.

But it's also pretty heavy - it contains lots of features that aren't necessary
for making simple JSON requests, which are most of the requests I make most of
the time.  If I'm bundling up a small Lambda function, it's better to have a
super small library to provide the same functionality without all the extra
stuff.

### SimplerAgent
- Can probably do most of what you need for API requests
- Has no production dependencies
- Is small: roughly 150 lines of code
- Is typed with Typescript
- Has good test coverage

### Installation

Easy enough:

```bash
$ npm install --save simpleragent
```

### What's Supported?
SimplerAgent is intended to be used for basic JSON requests:

```javascript
const request = require('simpleragent');

// Auth and query strings
request
    .get('http://www.example.com')
    .auth('my-user', 'pass')
    .query({name: 'bananas'})
    .end((err, resp) => {
        // Do something
    });

// Promises, within an async function.  String copy of the response body
// is available in the "text" attribute of the response.
const resp = await request
    .get('http://www.example.com/foo?bar=baz')
    .promise();
console.log(resp.text);

// Sending JSON bodies, HTTPS, and setting headers
request
    .post('https://api.example.com/v1/fruit')
    .set('Authorization', 'Bearer ' + myApiKey)
    .send({name: 'banana', type: 'peel'})
    .then((resp) => console.log(resp.body));

// Errors are thrown for non-2xx responses, with the status code
// and response object on the thrown error
try {
  const resp = await request
    .get('http://www.example.com/api/return-400')
    .promise();
} catch (e) {
    console.log(e.statusCode);
    console.log(e.response.body);
}
```

### What Isn't Supported?
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
