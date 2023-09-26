import * as assert from 'assert';
import * as nock from 'nock';
import { Client } from '../lib/client';

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

    it('can send without a path suffix', async () => {
        nock('http://www.unit-test.com:80')
            .patch('/api/v1')
            .reply(202, {result: false});

        const client = new Client('http://www.unit-test.com/api/v1');

        const resp = await client
            .patch()
            .send({first: 'Will', last: 'Ladislaw'});
        assert.equal(resp.body.result, false);
    });

    it('can construct client with setter', async () => {
        nock('http://www.unit-test.com:80', {reqheaders: {
            'authorization': 'Bearer abc123'
        }}).patch('/api/v1')
           .reply(202, {result: false});

        const client = new Client('http://www.unit-test.com/api')
                           .set('Authorization', 'Bearer abc123');

        const resp = await client.patch('/v1').send({first: 'Will', last: 'Ladislaw'});
        assert.equal(resp.body.result, false);
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
        const reqheaders = {Authorization: 'my-key', 'X-Other-Header': 'other-value'};
        nock('http://www.unit-test.com:80', {reqheaders}).delete('/api/v2').reply(204);

        const client = new Client('http://www.unit-test.com/api');
        client.delete('/v2')
            .set(reqheaders)
            .end((err, resp) => {
                assert.ok(!err);
                assert.equal(resp.statusCode, 204);
                done();
            });
    });

    it('should accept certificates', async () => {
        // NB we are only testing that the params are passed through to the
        // internal request options
        const client = new Client('https://www.unit-test.com/api')
            .cert('mycertificatestring')
            .key('mykeystring')
            .ca(['string1']);

        const req = client.delete('/v2');
        // @ts-ignore
        assert.equal(req._params.cert, 'mycertificatestring');
        // @ts-ignore
        assert.equal(req._params.key, 'mykeystring');
        // @ts-ignore
        assert.equal(req._params.ca[0], 'string1');
    });

    it('should abort on timeout', async function() {
        this.slow(2000);

        nock('http://www.unit-test.com:80')
            .get('/api/v1?foo=bar')
            .delay(1000)
            .reply(200, {result: 'OK'});

        const client = new Client('http://www.unit-test.com/api')
            .timeout(500);

        try {
            await client.get('/v1').query({foo: 'bar'});
        } catch (err) {
            assert.ok(err);
            assert.equal(err.message, 'Request timed out method=GET host=www.unit-test.com path=/api/v1?foo=bar status=none');
            assert(!err.statusCode);
            return;
        }
        throw new Error('Did not throw an error');
    });

    it('should accept a base url without a path', async () => {
        nock('http://www.unit-test.com:80')
            .get('/api/v1')
            .reply(200, {result: 'OK'});

        const client = new Client('http://www.unit-test.com');
        const resp = await client.get('/api/v1');
        assert.equal(resp.body.result, 'OK');
    });
});
