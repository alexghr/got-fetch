import { Got, Method, OptionsInit, OptionsOfUnknownResponseBody, Request } from 'got';
import { URL, URLSearchParams } from 'url';
import { format } from 'util';
import { GotFetchResponse } from './response.js';
import { finished, Readable   } from "node:stream";
import { once } from "node:events";
import { Body } from "./body-type.js";

type GotFetchRequestInit = Omit<RequestInit, 'body'> & {
  body?: Body | null;
};

export type GotFetch = (
  input: string | (GotFetchRequestInit & { url: string }),
  init?: GotFetchRequestInit
) => Promise<GotFetchResponse>;

const getMethodsWithBody = new Set(["GET", "HEAD"]);

export function createFetch(got: Got): GotFetch {
  const globalCache = new Map();

  return async (input, opts) => {
    const url = new URL(typeof input === 'string' ? input : input.url);
    const request: GotFetchRequestInit = typeof input === 'object' ? input : opts || {};

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

    const { body = "", headers: bodyHeaders } = serializeBody(request.body);

    const method: OptionsInit["method"] = (request.method as Method) ?? "GET";
    const gotOpts: OptionsInit = {
      // url needs to be stringified to support UNIX domain sockets, and
      // For more info see https://github.com/alexghr/got-fetch/pull/8
      url: url.toString(),
      searchParams,
      followRedirect: true,
      throwHttpErrors: false,
      method,
      resolveBodyOnly: false,
      // we'll do our own response parsing in `GotFetchResponse`
      responseType: undefined,
      allowGetBody: getMethodsWithBody.has(method.toUpperCase()) && Boolean(body),
      headers: {
        ...bodyHeaders,
        ...(request.headers as object),
      },
    };

    // there's a bug in got where it crashes if we send both a body and cache
    // https://github.com/sindresorhus/got/issues/1021
    if ((typeof request.cache === 'undefined' || request.cache === 'default') && !gotOpts.body) {
      gotOpts.cache = globalCache;
    }

    const gotReq = got({ ...gotOpts, isStream: true });

    if (request.signal) {
      const abortHandler = () => gotReq.destroy()
      request.signal.addEventListener('abort', abortHandler);
      const cleanup = finished(gotReq, () => {
        request.signal!.removeEventListener('abort', abortHandler);
        cleanup();
      })
    }

    try {
      // got creates a Duplex stream of the request but it only allows writing
      // to it sometimes. It's list of methods which accept a payload is
      // incomplete so alwasy try to close the request and swallow any errors
      if (body instanceof Readable) {
        body.pipe(gotReq);
      } else {
        gotReq.end(body);
      }
    } catch {
      // noop
      // I hate this
    }

    const raceController = new AbortController();
    // wait for the first chunk to arrive so that got gives us back the status
    // one of two things could happen: either we get back a body with a
    // length > 0, in which case at least one 'data' event is emitted; OR
    // we get an empty body (lenght === 0) in which case got will emit 'end'
    const [firstChunk] = await Promise.race([
      once(gotReq, "data", { signal: raceController.signal }),
      once(gotReq, "end", { signal: raceController.signal }),
    ]);
    // cancel whoever lost
    raceController.abort();

    const response = gotReq.response!;
    // put back the chunk we got (if any) or create an empty ReadableStream
    const responseBody = Readable.from(
      firstChunk ? restream(firstChunk, gotReq) : []
    );

    return new GotFetchResponse(responseBody, {
      headers: response.headers,
      redirected: response.redirectUrls && response.redirectUrls.length > 0,
      status: response.statusCode,
      statusText: response.statusMessage,
      type: "default",
      // according to spec this should be the final URL, after all redirects
      url:
        response.redirectUrls.length > 0
            // using Array.prototype.at would've been nice but it's not
            // supported by anything below Node 16.8
          ? response.redirectUrls[response.redirectUrls.length - 1].href
          : url.href,
    });
  }
}

async function* restream(firstChunk: unknown, req: Request): AsyncGenerator<unknown> {
  yield firstChunk;

  for await (const chunk of req) {
    yield chunk;
  }
}

function serializeBody(body: Body | null | undefined): Pick<OptionsOfUnknownResponseBody, 'body' | 'headers'> {
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
