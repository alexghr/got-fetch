import { GotFetchResponse } from '../lib/response';

describe('GotFetchResponse', () => {
  describe('body', () => {
    it.each<[string | Buffer, object]>([
     ['{ "foo": "bar" }', { foo: 'bar' }],
     [Buffer.from('{ "foo": "bar" }', 'utf8'), { foo: 'bar' }]
    ])('parses json', async (body, expectedJson) => {
      expect.assertions(1);
      const response = new GotFetchResponse(body, {});

      expect(response.json()).resolves.toEqual(expectedJson);
    });
  })
});