import got from 'got';
import { URLSearchParams } from 'url';

import { createFetch } from '../lib/fetch.js';
import { Interceptor, intercept, assert200, url } from './util.js';

describe('fetch request', () => {
  let interceptor: Interceptor;

  beforeEach(() => {
    interceptor = intercept();
  });

  describe('method', () => {
    it.each(['get', 'post', 'put', 'patch', 'delete', 'options', 'trace', 'head'])('%s', async (method) => {
      expect.assertions(1);
      interceptor.intercept('/', method).reply(200);

      const fetch = createFetch(got);
      await assert200(fetch(url('/'), { method }));
    });

    it('default is get', async () => {
      expect.assertions(1);
      interceptor.intercept('/', 'get').reply(200);

      const fetch = createFetch(got);
      await assert200(fetch(url('/')));
    });
  });

  describe('url', () => {
    it('passes pathname', async () => {
      expect.assertions(1);
      interceptor.intercept('/foo', 'get').reply(200);

      const fetch = createFetch(got);
      await assert200(fetch(url('/foo')));
    });
  });

  describe('querystring', () => {
    it('sends query string parameters', async () => {
      expect.assertions(1);
      interceptor.intercept('/', 'get').query({ foo: '123', bar: '456' }).reply(200);

      const fetch = createFetch(got);
      await assert200(fetch(url('/', { foo: '123', bar: '456' })));
    });

    it('merges query string parameters', async () => {
      expect.assertions(1);
      interceptor.intercept('/', 'get').query({ foo: '123', bar: '456' }).reply(200);

      const fetch = createFetch(got.extend({ searchParams: { bar: '456' } }));
      await assert200(fetch(url('/', { foo: '123' })));
    });
  });

  describe('headers', () => {
    it('sends headers', async () => {
      expect.assertions(1);
      interceptor.intercept('/', 'get').matchHeader('x-foo', 'bar').reply(200);

      const fetch = createFetch(got);
      await assert200(fetch(url('/'), {
        method: 'get',
        headers: {
          'x-foo': 'bar'
        }
      }));
    });

    it('sends inherited headers', async () => {
      expect.assertions(1);
      interceptor.intercept('/', 'get').matchHeader('x-foo', 'foo').reply(200);

      const fetch = createFetch(got.extend({ headers: { 'x-foo': 'foo' } }))
      await assert200(fetch(url('/')));
    });

    it('overwrites inherited headers', async () => {
      expect.assertions(1);
      interceptor.intercept('/', 'get').matchHeader('x-foo', '123').reply(200);

      const fetch = createFetch(got.extend({ headers: { 'x-foo': 'foo' } }))
      await assert200(fetch(url('/'), {
        headers: {
          'x-foo': '123'
        }
      }));
    });

    it('merges new headers', async () => {
      expect.assertions(1);
      interceptor.intercept('/', 'get')
        .matchHeader('x-foo', 'foo')
        .matchHeader('x-bar', 'bar')
        .reply(200);

      const fetch = createFetch(got.extend({ headers: { 'x-foo': 'foo' } }));
      await assert200(fetch(url('/'), { headers: { 'x-bar': 'bar' } }));
    });
  });

  describe('body', () => {
    const tests: ReadonlyArray<[string, string | URLSearchParams | Buffer, RegExp]> = [
      // test name, body, expected content type
      ['string', 'foo', /^text\/plain/],
      ['querystring', new URLSearchParams({ foo: 'foo' }), /^application\/x-www-form-urlencoded/],
      ['buffer', Buffer.from('foo', 'utf-8'), /^application\/octet-stream/]
    ];

    it.each(tests)('sends %s body', async (_, body) => {
      expect.assertions(1);
      interceptor.intercept('/', 'post', String(body)).reply(200);

      const fetch = createFetch(got);
      await assert200(fetch(url('/'), {
        method: 'post',
        body
      }));
    });

    it.each(tests)('sends content-type header', async (_, body, expectedContentType) => {
      expect.assertions(1);
      interceptor
        .intercept('/', 'post')
        .matchHeader('Content-Type', expectedContentType)
        .reply(200);

      const fetch = createFetch(got);
      await assert200(fetch(url('/'), {
        method: 'post',
        body
      }));
    });

    it('sends no request body if none passed', async () => {
      expect.assertions(1);
      interceptor.intercept('/', 'post', undefined).reply(200);

      const fetch = createFetch(got);
      await assert200(fetch(url('/'), {
        method: 'post',
      }));
    });

    it('sends the correct content-length on a multi-byte character for string payloads', async () => {
      expect.assertions(1);
      interceptor
        .intercept('/', 'post')
        .matchHeader('Content-Length', '4')
        .reply(200);

      const fetch = createFetch(got);
      await assert200(fetch(url('/'), {
        method: 'post',
        body: "𐍈"
      }));
    });

    it('sends the correct content-length on a multi-byte character for url search param payloads', async () => {
      expect.assertions(1);
      interceptor
        .intercept('/', 'post')
        .matchHeader('Content-Length', '16')
        .reply(200);

      const fetch = createFetch(got);
      await assert200(fetch(url('/'), {
        method: 'post',
        body: new URLSearchParams({ foo: "𐍈"})
      }));

    });
  });
});
