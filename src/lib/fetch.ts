import { GotInstance, GotBodyOptions } from 'got';
import { Readable } from 'stream';
import { format } from 'util';

import { GotFetchResponse } from './response';
import { URLSearchParams } from 'url';

export type GotFetch = typeof fetch;

export function createFetch(got: GotInstance): GotFetch {
  const globalCache = new Map();

  return async (input, opts) => {
    const url = typeof input === 'string' ? input : input.url;
    const request: RequestInit = typeof input === 'object' ? input : opts || {};
    const bodyOptions = serializeBody(request.body);

    if (request.cache === 'only-if-cached') {
      throw new TypeError(format('cache not supported: %s', request.cache));
    }

    if (request.redirect === 'manual') {
      throw new TypeError(format('redirect not supported: %s', request.redirect));
    }

    if (request.mode === 'no-cors' || request.mode === 'same-origin') {
      throw new TypeError(format('request.mode not supported: %s', request.mode));
    }

    const followRedirect = request.redirect === 'error' ? false : true;

    const response = got(url, {
      method: request.method || 'get',
      body: bodyOptions.body,
      cache: request.cache === 'no-cache' || request.cache === 'no-store' ? undefined : globalCache,
      headers: {
        ...bodyOptions.headers,
        ...request.headers as any
      },
      followRedirect,
      throwHttpErrors: false,
    });

    if (request.signal) {
      const abortHandler = () => response.cancel()
      request.signal.addEventListener('abort', abortHandler);
      response.then(() => request.signal!.removeEventListener('abort', abortHandler))
    }

    return response.then(r => {
      if (!followRedirect && (r.statusCode && r.statusCode >= 300 && r.statusCode < 400)) {
        return GotFetchResponse.error();
      }

      return new GotFetchResponse(r.body, {
        headers: r.headers,
        redirected: r.redirectUrls && r.redirectUrls.length > 0,
        status: r.statusCode,
        statusText: r.statusMessage,
        type: 'default',
        url
      });
    });
  }
}

function serializeBody(body: BodyInit | null | undefined): Pick<GotBodyOptions<any>, 'body' | 'headers'> {
  if (!body) {
    return {};
  } else if (body instanceof URLSearchParams) {
    return {
      body: body.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  } else if (typeof body === 'string' || Buffer.isBuffer(body) || (body instanceof Readable)) {
    return { body };
  } else {
    throw new TypeError('Unsupported body type');
  }
}