import got from 'got';
import nock from 'nock';
import { URL, URLSearchParams } from 'url';

import { createFetch, GotFetch } from '../lib/fetch';
import { stringify } from 'querystring';

const ORIGIN = 'https://example.com';

function absoluteUrl(path: string, qs?: Record<string, string>): string {
  const url = new URL(path, ORIGIN);
  url.search = qs ? stringify(qs) : '';

  return url.href;
}

describe('createFetch', () => {
  let interceptor: nock.Scope;
  let fetch: GotFetch;
  beforeEach(() => {
    interceptor = nock(ORIGIN);
    fetch = createFetch(got);
  });

  it.each<[string, string, number, string]>([
    ['get', '/', 200, 'hello'],
    ['post', '/', 200, 'hello'],
    ['options', '/', 200, '']
  ])('sends %s requests', async (method, path, status, body) => {
    expect.assertions(2);
    interceptor.intercept(path, method).reply(status, body);

    const response = await fetch(absoluteUrl(path), { method });
    expect(response.status).toEqual(status);
    expect(response.body).toEqual(body);
  });

  it('sends query string parameters', async () => {
    const expectedQuery = { foo: 'bar' };
    interceptor.intercept('/', 'get').query(expectedQuery).reply(200);
    await fetch(absoluteUrl('/', expectedQuery));
  });

  it.each<string | URLSearchParams>([
    'bodyType=string: foo',
    new URLSearchParams({ bodyType: 'form', foo: 'bar' }),
    JSON.stringify({bodyType: 'json', foo: 'bar'})
  ])('sends request body', async (body) => {
    interceptor.intercept('/', 'post', String(body)).reply(200);
    await fetch(absoluteUrl('/'), {
      method: 'post',
      body
    });
  });
});