import { jest } from "@jest/globals";
import { GotHeaders } from '../lib/headers.js';

describe('GotHeaders', () => {
  describe('constructor', () => {
    it.each<Record<string, string | string[]> | undefined>([
      {'Accept': 'application/json'},
      {'Accept': ['application/json', 'application/xml']},
      {},
      undefined
    ])
    ('can construct a headers instance', (headers) => {
      expect(() => new GotHeaders(headers)).not.toThrow();
    });
  });

  describe('set', () => {
    it('sets a header', () => {
      const headers = new GotHeaders();

      expect(headers.get('x-foo')).toBeNull();
      headers.set('x-foo', 'bar');
      expect(headers.get('x-foo')).toEqual('bar');
    });

    it('overwrites the header', () => {
      const headers = new GotHeaders({ 'x-foo': 'bar' });
      expect(headers.get('x-foo')).toEqual('bar');

      headers.set('x-foo', 'quux');
      expect(headers.get('x-foo')).toEqual('quux');
    });
  });

  describe('get', () => {
    it('searches case-insensitively for headers', () => {
      const headers = new GotHeaders();

      headers.set('X-foo', 'bar');
      expect(headers.get('X-foo')).toEqual('bar');
      expect(headers.get('x-foo')).toEqual('bar');
      expect(headers.get('X-FOO')).toEqual('bar');
      expect(headers.get('x-FoO')).toEqual('bar');
    });

    it('searches case-insensitively for headers used at initialization', () => {
      const headers = new GotHeaders({ 'X-foo': 'bar'});

      expect(headers.get('X-foo')).toEqual('bar');
      expect(headers.get('x-foo')).toEqual('bar');
      expect(headers.get('X-FOO')).toEqual('bar');
      expect(headers.get('x-FoO')).toEqual('bar');
    });

    it('joins multiple values with ", "', () => {
      const headers = new GotHeaders({ 'X-Foo': ['foo', 'bar']});
      expect(headers.get('x-foo')).toEqual('foo, bar');
    })
  });

  describe('append', () => {
    it('appends to existing headers', () => {
      const headers = new GotHeaders();

      headers.append('x-foo', 'foo');
      expect(headers.get('X-foo')).toEqual('foo');

      headers.append('x-foo', 'bar');
      expect(headers.get('X-foo')).toEqual('foo, bar');
    });
  });

  describe('when empty', () => {
    it('does not call the `forEach` callback', () => {
      const fn = jest.fn();
      const headers = new GotHeaders();
      headers.forEach(fn);
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe('getSetCookie', () => {
    it('should return set-cookie cookies', () => {
      const headers = new GotHeaders();

      headers.append('set-cookie', 'name1=value1');
      headers.append('set-cookie', 'name2=value2');

      expect(headers.getSetCookie()).toEqual(['name1=value1', 'name2=value2']);
    });
  });
});
