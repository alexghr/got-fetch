import got from 'got';

import { createFetch } from '../lib/fetch';
import { Interceptor, intercept, assert200, url } from './util';

describe('fetch response', () => {
  let interceptor: Interceptor;

  beforeEach(() => {
    interceptor = intercept();
  });

  it.each([200, 201, 400, 500])('sets status code', async (statusCode) => {
    expect.assertions(1);
    interceptor.intercept('/', 'post').reply(statusCode);

    const fetch = createFetch(got);
    const response = await fetch(url('/'), { method: 'post' });
    expect(response.status).toEqual(statusCode);
  });

  it('sets body', async () => {
    expect.assertions(1);
    interceptor.intercept('/', 'post').reply(201, { foo: 'bar' });

    const fetch = createFetch(got);
    const response = await fetch(url('/'), { method: 'post' });
    await expect(response.text()).resolves.toEqual('{"foo":"bar"}');
  });

  it('sets headers', async () => {
    expect.assertions(1);
    interceptor.intercept('/', 'post').reply(201, 'body', { 'Content-Type': 'text/plain' });

    const fetch = createFetch(got);
    const response = await fetch(url('/'), { method: 'post' });
    expect(response.headers.get('content-type')).toEqual('text/plain');
  });
});