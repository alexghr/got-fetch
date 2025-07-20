> [!IMPORTANT]
> Package has been deprecated. Please use the built-in fetch in Nodejs.
> 

# got-fetch

[![NPM](https://img.shields.io/npm/l/got-fetch)](https://github.com/alexghr/got-fetch/blob/main/LICENSE)
[![Release workflow](https://github.com/alexghr/got-fetch/actions/workflows/release.yml/badge.svg)](https://github.com/alexghr/got-fetch/actions/workflows/release.yml)
[![semantic-release: angular](https://img.shields.io/badge/semantic--release-angular-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)
[![npm](https://img.shields.io/npm/v/got-fetch)](https://www.npmjs.com/package/got-fetch)
[![npm](https://img.shields.io/npm/dm/got-fetch)](https://npmcharts.com/compare/got-fetch?interval=30&log=false)

A `fetch`-compatible wrapper around [got] for those times when you need to
fetch stuff over HTTP 😉

Why would you use this instead of got? Sometimes you might need a fetch
wrapper and this is it (e.g. [Apollo uses `fetch` to query remote schemas]).

## Before you install

If you're using on NodeJS v18 or greater than you should be using its global fetch. It's better integrated, better supported and has more features. 

[Native fetch](https://nodejs.org/dist/latest-v18.x/docs/api/globals.html#fetch)

## Install

Support table:

|`got-fetch` version|works with `got` version|Notes                                |
|-------------------|------------------------|-------------------------------------|
|^5.0.0             |^12.0.0                 |ESM package. You have to use `import`|
|^4.0.0             |^11.0.0                 |CJS package. You can use `require`   |

`got` is a peer dependency so you will need to install it alongside `got-fetch`:

```sh
npm install --save got got-fetch
```

For CommonJS support, we maintain [v4 of this package](https://github.com/alexghr/got-fetch/tree/4.x).

## Usage

Use the default export:

```js
import fetch from 'got-fetch';

// in ESM we can use top-level await
const resp = await fetch('https://example.com');

console.log(resp.status); // 200
console.log(await resp.text()); // a HTML document
```

The module also exports a function which allows you to use your own custom
`got` instance:

```js
import got from 'got';
import { createFetch } from 'got-fetch';

const myGot = got.extend({
  headers: {
    'x-api-key': 'foo bar'
  }
});

const fetch = createFetch(myGot);

// this request will send the header `x-api-key: foo bar`
fetch('https://example.com');
```

## Limitations

`fetch` is designed for browser environments and this package is just a wrapper
around a Node-based HTTP client. Not all `fetch` features are supported:
- ❌ [RequestMode] `no-cors`, `same-origin`, `navigate`
- ❌ [RequestCache] `only-if-cached`
- ❌ [RequestRedirect] `error`, `manual`
- ❌ response body streaming. See https://github.com/alexghr/got-fetch/issues/25
- ❗ ESM vs CJS packages. See https://github.com/alexghr/got-fetch/issues/70
- ❗ [RequestHeaders] must be a plain object
- ❗ [RequestCache] if unset (or `default`) will use got's [caching algorithm]
  (any other value will disable caching)

## License

See [LICENSE] for information.

[got]: https://github.com/sindresorhus/got
[LICENSE]: ./LICENSE

[RequestMode]: https://fetch.spec.whatwg.org/#concept-request-mode
[RequestCache]: https://fetch.spec.whatwg.org/#concept-request-cache-mode
[RequestRedirect]: https://fetch.spec.whatwg.org/#concept-request-redirect-mode
[RequestHeaders]: https://fetch.spec.whatwg.org/#ref-for-concept-request-header-list
[caching algorithm]: https://github.com/sindresorhus/got/tree/f59a5638b93c450dc722848b58b09a44f730a66f#cache-adapters
[Apollo uses `fetch` to query remote schemas]: https://www.apollographql.com/docs/graphql-tools/remote-schemas/
