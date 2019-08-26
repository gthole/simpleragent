import assert = require('assert');
import nock = require('nock');
import Client = require('../lib/client');

describe('SimplerAgent Client', () => {
    afterEach(() => nock.cleanAll());

    it('should "get" resources', async () => {
        nock('http://www.unit-test.com:80')
            .get('/api/v1')
            .reply(200, {result: 'OK'});

        const client = new Client('http://www.unit-test.com/api');
        const resp = await client.get('/v1');
        assert.equal(resp.body.result, 'OK');
    });

    it('should "get" resources with search parameters', async () => {
        nock('http://www.unit-test.com:80')
            .get('/api/v1?foo=bar')
            .reply(200, {result: 'OK'});

        const client = new Client('http://www.unit-test.com/api');
        const resp = await client.get('/v1').query({foo: 'bar'});
        assert.equal(resp.body.result, 'OK');
    });

    it('should return errors for 400s', async () => {
        nock('http://www.unit-test.com:80')
            .get('/api/v1?foo=Bulstrode')
            .reply(400, {result: 'Bad request'});

        try {
            const client = new Client('http://www.unit-test.com/api');
            await client.get('/v1').query('foo=Bulstrode');
        } catch (err) {
            assert.equal(err.statusCode, 400);
            return;
        }
        throw new Error('Did not throw an error');
    });

    it('should return errors for 500s', async () => {
        nock('http://www.unit-test.com:80')
            .get('/api/v1?foo=Bulstrode')
            .reply(500, {result: 'Raffles!'});

        try {
            const client = new Client('http://www.unit-test.com/api');
            await client.get('/v1').query('foo=Bulstrode');
        } catch (err) {
            assert.ok(err);
            assert.equal(err.statusCode, 500);
            return;
        }
        throw new Error('Did not throw an error');
    });

    it('should "put" resources', async () => {
        nock('https://www.unit-test.com:443')
            .put('/api/v1')
            .reply(200, {result: 'OK'});

        const client = new Client('https://www.unit-test.com/api');
        const resp = await client.put('/v1')
            .send({first: 'Dorothea', last: 'Brook'});

        assert.equal(resp.body.result, 'OK');
    });

    it('should accept a string body', async () => {
        nock('https://www.unit-test.com:443')
            .put('/api/v1')
            .reply(200, {result: 'YES'});

        const client = new Client('https://www.unit-test.com/api');
        const resp = await client.put('/v1').send('{"foo": "bar"}');

        assert.equal(resp.body.result, 'YES');
    });

    it('should "head" resources', async () => {
        nock('http://www.unit-test.com:80')
            .head('/api/v1')
            .reply(200);

        const client = new Client('http://www.unit-test.com/api');
        const resp = await client.head('/v1');
        assert.ok(!resp.body);
    });

    it('should "post" resources', async () => {
        nock('http://www.unit-test.com:80', {reqheaders: {
            'authorization': 'Basic ' + Buffer.from('user:pass').toString('base64'),
        }}).post('/api/v1')
           .reply(201, {result: true});

        const client = new Client('http://www.unit-test.com/api');
        const resp = await client.post('/v1')
            .auth('user', 'pass')
            .send({first: 'Tertius', last: 'Lydgate'});

        assert.equal(resp.body.result, true);
    });

    it('should "patch" resources', async () => {
        nock('http://www.unit-test.com:80', {reqheaders: {
            'authorization': 'Bearer abc123'
        }}).patch('/api/v1')
           .reply(202, {result: false});

        const client = new Client(
            'http://www.unit-test.com/api',
            {Authorization: 'Bearer abc123'}
        );

        const resp = await client.patch('/v1').send({first: 'Will', last: 'Ladislaw'});
        assert.equal(resp.body.result, false);
    });

    it('should "delete" resources', async () => {
        nock('http://www.unit-test.com:80').delete('/api/v1').reply(204);

        const client = new Client('http://www.unit-test.com/api');
        const resp = await client.del('/v1');
        assert.equal(resp.statusCode, 204);
    });

    it('should accept headers as an object', (done) => {
        const headers = {Authorization: 'my-key', 'X-Other-Header': 'other-value'};
        nock('http://www.unit-test.com:80', headers).delete('/api/v2').reply(204);

        const client = new Client('http://www.unit-test.com/api');
        client.delete('/v2')
            .set(headers)
            .end((err, resp) => {
                assert.ok(!err);
                assert.equal(resp.statusCode, 204);
                done();
            });
    });
});
