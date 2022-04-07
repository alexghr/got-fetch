import { CancelableRequest, Got, Method, Options as GotOptions, Response } from 'got';
import { Readable } from 'stream';
import { URL, URLSearchParams } from 'url';
import { format } from 'util';
import { GotFetchResponse } from './response';


export type GotFetch = typeof fetch;

export function createFetch(got: Got): GotFetch {
  const globalCache = new Map();

  return async (input, opts) => {
    const url = new URL(typeof input === 'string' ? input : input.url);
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

    // got does not merge base searchParams with the url's searchParams
    // but it does merge searchParams options
    // so we clone the url's searchParams
    // we also clear the url's search to work around this bug
    // https://github.com/sindresorhus/got/issues/1188
    const searchParams = new URLSearchParams(url.searchParams);
    url.search = '';

    const gotOpts: GotOptions = {
      // url needs to be stringified to support UNIX domain sockets, and
      // For more info see https://github.com/alexghr/got-fetch/pull/8
      url: url.toString(),
      searchParams,
      followRedirect: true,
      throwHttpErrors: false,
      method: (request.method as Method) || 'get',
      isStream: false,
      resolveBodyOnly: false,
      // we'll do our own response parsing in `GotFetchResponse`
      responseType: undefined
    };

    const { body, headers: bodyHeaders = {} } = serializeBody(request.body);

    // only set the `body` key on the options if a body is sent
    // otherwise got crashes
    if (body) {
      gotOpts.body = body;
    }

    const headers: GotOptions["headers"] = { ...bodyHeaders };
    if (request.headers) {
      if (Array.isArray(request.headers)) {
        request.headers.forEach(([header, value]) => {
          headers[header.toLowerCase()] = value;
        });
      } else if (typeof request.headers?.forEach === "function") {
        request.headers.forEach((value, header) => {
          headers[header.toLowerCase()] = value;
        });
      } else {
        Object.keys(request.headers).forEach((header) => {
          headers[header.toLowerCase()] = (request.headers as Record<string, string>)[header];
        });
      }
    }

    gotOpts.headers = headers;

    // there's a bug in got where it crashes if we send both a body and cache
    // https://github.com/sindresorhus/got/issues/1021
    if ((typeof request.cache === 'undefined' || request.cache === 'default') && !gotOpts.body) {
      gotOpts.cache = globalCache;
    }

    const response = got(gotOpts) as CancelableRequest<Response<string | Buffer>>;

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
        type: "default",
        // according to spec this should be the final URL, after all redirects
        url:
          r.redirectUrls.length > 0
              // using Array.prototype.at would've been nice but it's not
              // supported by anything below Node 16.8
            ? r.redirectUrls[r.redirectUrls.length - 1]
            : url.href,
      });
    });
  }
}

function serializeBody(body: BodyInit | null | undefined): Pick<GotOptions, 'body' | 'headers'> {
  if (!body) {
    return {};
  } else if (body instanceof URLSearchParams) {
    const serialized = body.toString();
    return {
      body: serialized,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        'Content-Length': String(Buffer.byteLength(serialized, 'utf8'))
      }
    }
  } else if (typeof body === 'string') {
    return {
      body,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Length': String(Buffer.byteLength(body, 'utf8')),
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
