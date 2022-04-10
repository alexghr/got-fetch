
/**
 * Spec:
 * https://fetch.spec.whatwg.org/#response-class
 */

import { IncomingHttpHeaders } from 'http2';
import {Readable, Stream} from 'stream';
import { format } from 'util';
import {Body} from './body-type.js';

import { GotHeaders } from './headers.js';

type ResponseInit = {
  status?: number;
  statusText?: string | Buffer;
  headers?: IncomingHttpHeaders;
  url?: string;
  redirected?: boolean;
  type?: ResponseType;
};

export class GotFetchResponse implements Response {
  readonly headers: GotHeaders;
  readonly redirected: boolean;
  readonly status: number;
  readonly statusText: string;
  readonly url: string;
  readonly type: ResponseType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  /**
   * This is a Node Readable stream
   */
  readonly body: any | null;

  #bodyUsed = false;

  constructor(
    body: Body | null,
    init?: ResponseInit | null
  ) {
    if (init && typeof init.status === 'number' && (init.status < 200 || init.status > 599)) {
      throw new RangeError(format('init.status is out of range: %s', init.status));
    }

    this.body = body;

    this.type = init && init.type || 'basic';
    this.headers = new GotHeaders(init ? init.headers : undefined, 'immutable');

    this.status = init && init.status || 0;
    this.statusText = String(init && init.statusText || '');

    this.url = init && init.url || '';
    this.redirected = init && init.redirected || false;
  }

  get bodyUsed(): boolean {
    return this.#bodyUsed
  }

  get ok(): boolean {
    return this.status >= 200 && this.status <= 299;
  }

  get trailer(): Promise<Headers> {
    return Promise.reject(new TypeError('`trailer` promise not supported'));
  }

  arrayBuffer(): Promise<ArrayBuffer> {
    throw new Error("`arrayBuffer` not implemented");
  }

  blob(): Promise<Blob> {
    throw new Error('`blob` not implemented');
  }

  formData(): Promise<FormData> {
    return this.text().then(body => new URLSearchParams(body));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json(): Promise<any> {
    return this.text().then(JSON.parse);
  }

  async text(): Promise<string> {
    this.#bodyUsed = true;

    if (this.body === null) {
      return Promise.resolve('');
    }

    if (typeof this.body === 'string') {
      return Promise.resolve(this.body);
    } else if (Buffer.isBuffer(this.body)) {
      return Promise.resolve(this.body.toString('utf8'));
    } else {
      let body = '';
      for await (const chunk of this.body) {
        body += chunk;
      }

      return body;
    }
  }

  clone(): GotFetchResponse {
    throw new Error('clone not implemented');
  }

  static error(): GotFetchResponse {
    return new GotFetchResponse(null, { type: 'error' });
  }
}
