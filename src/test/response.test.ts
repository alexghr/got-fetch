import { GotFetchResponse } from '../lib/response.js';

describe('GotFetchResponse', () => {
  it.each<[string | Buffer, any]>([
    ['1', 1],
    ['true', true],
    ['false', false],
    ['"foo"', 'foo'],
    ['["foo"]', ['foo']],
    ['{ "foo": "bar" }', { foo: 'bar' }],
    [Buffer.from('{ "foo": "bar" }', 'utf8'), { foo: 'bar' }]
  ])('json', async (body, expectedJson) => {
    expect.assertions(1);
    const response = new GotFetchResponse(body, {});

    await expect(response.json()).resolves.toEqual(expectedJson);
  });

  it('formData', async () => {
    expect.assertions(2);
    const response = new GotFetchResponse('foo=1&bar=2');
    const formData = await response.formData();

    expect(formData.get('foo')).toEqual('1');
    expect(formData.get('bar')).toEqual('2');
  });

  it.each<[number, boolean]>([
    [200, true],
    [201, true],
    [301, false],
    [400, false],
    [500, false]
  ])('ok', (status, ok) => {
    expect.assertions(2);
    const response = new GotFetchResponse(null, { status });

    expect(response.status).toEqual(status);
    expect(response.ok).toEqual(ok);
  });
});
