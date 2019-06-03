import nock from 'nock';
import { createFetch, GotFetch } from '../lib/fetch';
import got from 'got';

const HOST = 'https://example.com';

describe('createFetch', () => {
  let interceptor: nock.Scope;
  let fetch: GotFetch;
  beforeEach(() => {
    interceptor = nock(HOST);
    fetch = createFetch(got);
  });

  it.each<[string, string, number, string]>([
    ['get', '/', 200, 'hello'],
    ['post', '/', 200, 'hello'],
    ['options', '/', 200, '']
  ])('sends %s requests', async (method, path, status, body) => {
    expect.assertions(2);
    interceptor.intercept(path, method).reply(status, body);

    const response = await fetch(HOST, { method });
    expect(response.status).toEqual(status);
    expect(response.body).toEqual(body);
  });
});