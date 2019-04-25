import assert = require('assert');
import nock = require('nock');
import request = require('../lib/');

describe('SimplerAgent requests', () => {
    afterEach(() => nock.cleanAll());

    it('should "get" resources', (done) => {
        nock('http://www.unit-test.com:80')
            .get('/api/v1')
            .reply(200, {result: 'OK'});

        request
            .get('http://www.unit-test.com/api/v1')
            .end((err, resp) => {
                assert.ok(!err);
                assert.equal(resp.body.result, 'OK');
                done(err);
            });
    });

    it('should "get" resources with search parameters', (done) => {
        nock('http://www.unit-test.com:80')
            .get('/api/v1?foo=bar')
            .reply(200, {result: 'OK'});

        request
            .get('http://www.unit-test.com/api/v1')
            .query({foo: 'bar'})
            .end((err, resp) => {
                assert.ok(!err);
                assert.equal(resp.body.result, 'OK');
                done(err);
            });
    });

    it('should return errors for 400s', (done) => {
        nock('http://www.unit-test.com:80')
            .get('/api/v1?foo=Bulstrode')
            .reply(400, {result: 'Bad request'});

        request
            .get('http://www.unit-test.com/api/v1')
            .query('foo=Bulstrode')
            .end((err, resp) => {
                assert.ok(err);
                assert.equal(err.statusCode, 400);
                done();
            });
    });

    it('should return errors for 500s', (done) => {
        nock('http://www.unit-test.com:80')
            .get('/api/v1?foo=Bulstrode')
            .reply(500, {result: 'Raffles!'});

        request
            .get('http://www.unit-test.com/api/v1')
            .query('foo=Bulstrode')
            .catch((err) => {
                assert.ok(err);
                assert.equal(err.statusCode, 500);
                done();
            });
    });

    it('should "put" resources', (done) => {
        nock('https://www.unit-test.com:443')
            .put('/api/v1')
            .reply(200, {result: 'OK'});

        request
            .put('https://www.unit-test.com/api/v1')
            .send({first: 'Dorothea', last: 'Brook'})
            .end((err, resp) => {
                assert.ok(!err);
                assert.equal(resp.body.result, 'OK');
                done(err);
            });
    });

    it('should accept a string body', (done) => {
        nock('https://www.unit-test.com:443')
            .put('/api/v1')
            .reply(200, {result: 'YES'});

        request
            .put('https://www.unit-test.com/api/v1')
            .send('{"foo": "bar"}')
            .end((err, resp) => {
                assert.ok(!err);
                assert.equal(resp.body.result, 'YES');
                done(err);
            });
    });

    it('should "head" resources', (done) => {
        nock('http://www.unit-test.com:80')
            .head('/api/v1')
            .reply(200);

        request
            .head('http://www.unit-test.com/api/v1')
            .end((err, resp) => {
                assert.ok(!err);
                assert.ok(!resp.body);
                done(err);
            });
    });

    it('should "post" resources', (done) => {
        nock('http://www.unit-test.com:80', {reqheaders: {
            'authorization': 'Basic ' + Buffer.from('user:pass').toString('base64'),
        }}).post('/api/v1')
           .reply(201, {result: true});

        request
            .post('http://www.unit-test.com/api/v1')
            .auth('user', 'pass')
            .send({first: 'Tertius', last: 'Lydgate'})
            .end((err, resp) => {
                assert.ok(!err);
                assert.equal(resp.body.result, true);
                done(err);
            });
    });

    it('should "patch" resources', (done) => {
        nock('http://www.unit-test.com:80', {reqheaders: {
            'authorization': 'Bearer abc123'
        }}).patch('/api/v1')
           .reply(202, {result: false});

        request
            .patch('http://www.unit-test.com/api/v1')
            .set('Authorization', 'Bearer abc123')
            .send({first: 'Will', last: 'Ladislaw'})
            .end((err, resp) => {
                assert.ok(!err);
                assert.equal(resp.body.result, false);
                done(err);
            });
    });

    it('should "delete" resources', (done) => {
        nock('http://www.unit-test.com:80').delete('/api/v1').reply(204);

        request
            .del('http://www.unit-test.com/api/v1')
            .then(
                (resp) => done(),
                (err) => done(err)
            );
    });

    it('should accept headers as an object', (done) => {
        const headers = {Authorization: 'my-key', 'X-Other-Header': 'other-value'};
        nock('http://www.unit-test.com:80', headers).delete('/api/v2').reply(204);

        // @ts-ignore
        request.delete('http://www.unit-test.com/api/v2')
            .set(headers)
            .then(
                (resp) => done(),
                (err) => done(err)
            );
    });
});
