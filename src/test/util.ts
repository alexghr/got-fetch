import nock from 'nock';
import { URL } from 'url';

const ORIGIN = 'https://example.com';

export type Interceptor = nock.Scope;
export function intercept(): Interceptor {
  return nock(ORIGIN);
}

export function url(path: string, qs?: Record<string, string>): string {
  const url = new URL(path, ORIGIN);

  if (qs) {
    Object.entries(qs)
      .forEach(([key, value]) => url.searchParams.set(key, value));
  }

  return url.href;
}

export async function assert200(response$: Promise<Response>) {
  const response = await response$;
  expect(response.status).toBe(200);
}