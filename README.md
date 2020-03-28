# got-fetch

A `fetch`-compatible wrapper around [got] for those times when you need to
fetch stuff over HTTP 😉

Why would you use this instead of got? Sometimes you might need a fetch
wrapper and this is it (e.g. [Apollo uses `fetch` to query remote schemas]).


## Install

`got` is a peer dependency so you will need to install it alongside `got-fetch`:

```sh
$ npm install --save got got-fetch
```

If you use Typescript then you will also need `@types/got` if you want your
project to build:

```sh
$ npm install --save-dev @types/got
```

## Usage

The module exports a global instance ready to fetch resources:

```js
const { fetch } = require('got-fetch');

fetch('https://example.com').then(resp => {
  console.log(resp.status); // should be 200
  resp.text().then(body => console.log(body)); // should be some HTML code
});
```

The module also exports a function which allows you to use your own custom
`got` instance:

```js
const got = require('got');
const { createFetch } = require('got-fetch');

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