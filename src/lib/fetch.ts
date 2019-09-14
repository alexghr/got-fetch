import { GotInstance, GotBodyOptions, GotBodyFn } from 'got';
import { Readable } from 'stream';
import { format } from 'util';

import { GotFetchResponse } from './response';
import { URLSearchParams } from 'url';
import { OutgoingHttpHeaders } from 'http';

export type GotFetch = typeof fetch;

export function createFetch(got: GotInstance<GotBodyFn<any>>): GotFetch {
  const globalCache = new Map();

  return async (input, opts) => {
    const url = typeof input === 'string' ? input : input.url;
    const request: RequestInit = typeof input === 'object' ? input : opts || {};

    if (request.mode === 'no-cors' || request.mode === 'same-origin' || request.mode === 'navigate') {
      throw new TypeError(format('request.mode not supported: %s', request.mode));
    }

    if (request.cache === 'only-if-cached') {
      throw new TypeError(format('request.cache not supported: %s', request.cache));
    }

    if (request.redirect === 'error' || request.redirect === 'manual') {
      throw new TypeError(format('request.redirect not supported: %s', request.redirect));
    }

    // naive check to make sure headers are a plain object
    if (request.headers && typeof request.headers !== 'object') {
      throw new TypeError(format('request.headers must be plain object: %j', request.headers));
    }

    const method = request.method || 'get';
    const { body, headers: bodyHeaders } = serializeBody(request.body);
    const headers: OutgoingHttpHeaders = {
        ...bodyHeaders,
        ...(request.headers as object)
    }

    // use a cache by default
    const cache = typeof request.cache === 'undefined' || request.cache === 'default' ? globalCache : undefined;

    const response = got(url, {
      method,
      body,
      cache,
      headers,
      followRedirect: true,
      throwHttpErrors: false,
    });

    if (request.signal) {
      const abortHandler = () => response.cancel()
      request.signal.addEventListener('abort', abortHandler);
      response.then(() => request.signal!.removeEventListener('abort', abortHandler))
    }

    return response.then(r => {
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
    const serialized = body.toString();
    return {
      body: serialized,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        'Content-Length': serialized.length
      }
    }
  } else if (typeof body === 'string') {
    return {
      body,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Length': body.length
      }
    };
  } else if (Buffer.isBuffer(body) || (body instanceof Readable)) {
    return {
      body,
      headers: {
        'Content-Type': 'application/octet-stream'
      }
    };
  } else {
    throw new TypeError('Unsupported request body');
  }
}