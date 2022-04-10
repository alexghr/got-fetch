import got from 'got';
import { createFetch } from '../lib/fetch.js';
import { Interceptor, intercept, url } from './util.js';

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

  type UrlTest = {
    interceptions: ReadonlyArray<{
      request: [string, string];
      response: [number, string, Record<string, string>];
    }>;
    testUrl: string;
    testMethod: string;
    expectedUrl: string;
  };

  it.each<UrlTest>([
    // standard 200
    {
      interceptions: [
        {
          request: ["/", "get"],
          response: [200, "", {}],
        },
      ],
      testUrl: url("/"),
      testMethod: "get",
      expectedUrl: url("/"),
    },
    // 301 get redirect
    {
      interceptions: [
        {
          request: ["/", "get"],
          response: [301, "", { location: "/redirected" }],
        },
        {
          request: ["/redirected", "get"],
          response: [200, "", {}],
        },
      ],
      testUrl: url("/"),
      testMethod: "get",
      expectedUrl: url("/redirected"),
    },
    // 302 get redirect
    {
      interceptions: [
        {
          request: ["/", "get"],
          response: [302, "", { location: "/redirected" }],
        },
        {
          request: ["/redirected", "get"],
          response: [200, "", {}],
        },
      ],
      testUrl: url("/"),
      testMethod: "get",
      expectedUrl: url("/redirected"),
    },
    // Bugged in Got 12. Github ticket TBD
    // 302 post redirect
    // {
    //   interceptions: [
    //     {
    //       request: ["/", "post"],
    //       response: [302, "", { location: "/redirected" }],
    //     },
    //     {
    //       request: ["/redirected", "post"],
    //       response: [200, "", {}],
    //     },
    //   ],
    //   testUrl: url("/"),
    //   testMethod: "post",
    //   expectedUrl: url("/redirected"),
    // },
    // 303 redirect mixed methods
    // {
    //   interceptions: [
    //     {
    //       request: ["/", "post"],
    //       response: [303, "", { location: "/redirected" }],
    //     },
    //     {
    //       request: ["/redirected", "get"],
    //       response: [200, "", {}],
    //     },
    //   ],
    //   testUrl: url("/"),
    //   testMethod: "post",
    //   expectedUrl: url("/redirected"),
    // },
  ])(
    "returns final url",
    async ({ interceptions, testUrl, testMethod, expectedUrl }) => {
      expect.assertions(1);
      interceptions.forEach(({ request: [url, method], response: [statusCode, body, headers] }) => {
        interceptor.intercept(url, method).reply(statusCode, body, headers);
      })

      const fetch = createFetch(got);
      const response = await fetch(testUrl, { method: testMethod });
      expect(response.url).toEqual(expectedUrl);
    }
  );
});
