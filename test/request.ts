import assert = require('assert');
import nock = require('nock');
import request = require('../lib/');

describe('SimplerAgent Request', () => {
    afterEach(() => nock.cleanAll());

    it('should "get" resources', async () => {
        nock('http://www.unit-test.com:80')
            .get('/api/v1')
            .reply(200, {result: 'OK'});

        const resp = await request.get('http://www.unit-test.com/api/v1');
        assert.equal(resp.body.result, 'OK');
    });

    it('should "get" resources with search parameters', async () => {
        nock('http://www.unit-test.com:80')
            .get('/api/v1?foo=bar')
            .reply(200, {result: 'OK'});

        const resp = await request
            .get('http://www.unit-test.com/api/v1')
            .query({foo: 'bar'});

        assert.equal(resp.body.result, 'OK');
    });

    it('should return errors for 400s', async () => {
        nock('http://www.unit-test.com:80')
            .get('/api/v1?foo=Bulstrode')
            .reply(400, {result: 'Bad request'});

        try {
            await request
                .get('http://www.unit-test.com/api/v1')
                .query('foo=Bulstrode');
        } catch (err) {
            assert.equal(err.statusCode, 400);
            assert.equal(
                err.message,
                'Bad response from server. host=www.unit-test.com:80 path=/api/v1?foo=Bulstrode status=400\n{"result":"Bad request"}'
            );
            return;
        }
        throw new Error('Did not throw an error');
    });

    it('should return errors for 500s', async () => {
        nock('http://www.unit-test.com:80')
            .get('/api/v1?foo=Bulstrode')
            .reply(500, {result: 'Raffles!'});

        try {
            await request
                .get('http://www.unit-test.com/api/v1')
                .query('foo=Bulstrode');
        } catch (err) {
            assert.ok(err);
            assert.equal(err.statusCode, 500);
            return;
        }
        throw new Error('Did not throw an error');
    });

    it('should return connection errors', async () => {
        try {
            await request
                .get('http://alskdfjaerhgliualkajsfawehfjklsfjka.com/api/v1');
        } catch (err) {
            assert.equal(err.statusCode, undefined);
            assert.equal(
                err.message,
                'Connection Error: getaddrinfo ' +
                'ENOTFOUND alskdfjaerhgliualkajsfawehfjklsfjka.com ' +
                'host=alskdfjaerhgliualkajsfawehfjklsfjka.com:80 ' +
                'path=/api/v1 ' +
                'status=none'
            );
            return;
        }
        throw new Error('Did not throw an error');
    });


    it('should "put" resources', async () => {
        nock('https://www.unit-test.com:443')
            .put('/api/v1')
            .reply(200, {result: 'OK'});

        const resp = await request
            .put('https://www.unit-test.com/api/v1')
            .send({first: 'Dorothea', last: 'Brook'});

        assert.equal(resp.body.result, 'OK');
    });

    it('should accept a string body', async () => {
        nock('https://www.unit-test.com:443')
            .put('/api/v1')
            .reply(200, {result: 'YES'});

        const resp = await request
            .put('https://www.unit-test.com/api/v1')
            .send('{"foo": "bar"}');

        assert.equal(resp.body.result, 'YES');
    });

    it('should "head" resources', async () => {
        nock('http://www.unit-test.com:80')
            .head('/api/v1')
            .reply(200);

        const resp = await request.head('http://www.unit-test.com/api/v1');
        assert.ok(!resp.body);
    });

    it('should "post" resources', async () => {
        nock('http://www.unit-test.com:80', {reqheaders: {
            'authorization': 'Basic ' + Buffer.from('user:pass').toString('base64'),
        }}).post('/api/v1')
           .reply(201, {result: true});

        const resp = await request
            .post('http://www.unit-test.com/api/v1')
            .auth('user', 'pass')
            .send({first: 'Tertius', last: 'Lydgate'});

        assert.equal(resp.body.result, true);
    });

    it('should "patch" resources', async () => {
        nock('http://www.unit-test.com:80', {reqheaders: {
            'authorization': 'Bearer abc123'
        }}).patch('/api/v1')
           .reply(202, {result: false});

        const resp = await request
            .patch('http://www.unit-test.com/api/v1')
            .set('Authorization', 'Bearer abc123')
            .send({first: 'Will', last: 'Ladislaw'});

        assert.equal(resp.body.result, false);
    });

    it('should "delete" resources', async () => {
        nock('http://www.unit-test.com:80').delete('/api/v1').reply(204);

        const resp = await request.del('http://www.unit-test.com/api/v1');
        assert.equal(resp.statusCode, 204);
    });

    it('should accept headers as an object', (done) => {
        const headers = {Authorization: 'my-key', 'X-Other-Header': 'other-value'};
        nock('http://www.unit-test.com:80', headers).delete('/api/v2').reply(204);

        // @ts-ignore
        request.delete('http://www.unit-test.com/api/v2')
            .set(headers)
            .end((err, resp) => {
                assert.ok(!err);
                assert.equal(resp.statusCode, 204);
                done();
            });
    });

    it('should retry without a delay', async () => {
        let attempts = 0;
        nock('http://www.unit-test.com:80')
            .get('/api/v1?q=foo')
            .times(5)
            .reply((uri, body) => {
                attempts += 1;
                if (attempts === 5) {
                    return [200, {}];
                }
                return [500, {}];
            });

        const resp = await request
            .get('http://www.unit-test.com/api/v1?q=foo')
            .retry(4);

        assert.equal(resp.statusCode, 200);
    });

    it('should throw an error if it runs out of retries', async () => {
        nock('http://www.unit-test.com:80')
            .get('/api/v1')
            .times(6)
            .reply(503);

        try {
            await request
                .get('http://www.unit-test.com/api/v1')
                .retry(5);
        } catch (e) {
            assert.equal(e.statusCode, 503);
            return;
        }
        throw new Error('Did not throw an error');
    });

    it('should retry with a delay', async () => {
        const start = Date.now();
        let attempts = 0;
        nock('http://www.unit-test.com:80')
            .post('/api/v1')
            .times(3)
            .reply(() => {
                attempts += 1;
                if (attempts === 3) {
                    return [200, {}];
                }
                return [500, {}];
            });

        const resp = await request
            .post('http://www.unit-test.com/api/v1')
            .retry({retries: 2, delay: 100});

        assert.equal(resp.statusCode, 200);
        assert(Date.now() - start > 200);
    });

    it('should retry with a backoff', async () => {
        const start = Date.now();
        let attempts = 0;
        nock('http://www.unit-test.com:80')
            .put('/api/v1')
            .times(4)
            .reply(() => {
                attempts += 1;
                if (attempts === 4) {
                    return [200, {}];
                }
                return [500, {}];
            });

        const resp = await request
            .put('http://www.unit-test.com/api/v1')
            .retry({retries: 3, delay: 100, backoff: 2});

        // 100 + 200 + 400
        assert.equal(resp.statusCode, 200);
        assert(Date.now() - start > 700);
    });

});
