export type GotHeadersGuard = 'immutable' | 'none';

export class GotHeaders implements Headers {
  private headers: Map<string, string[]>;
  private guard: GotHeadersGuard;

  constructor(headers?: Record<string, string | string[] | undefined>, guard: GotHeadersGuard = 'none') {
    const init: [string, string[]][] = headers ? Object.entries(headers).map(([name, values]) => {
      if (typeof values === 'string') {
        return [name.toLowerCase(), [values]];
      } else if (Array.isArray(values)) {
        return [name.toLowerCase(), values];
      } else {
        return [name.toLowerCase(), []];
      }
    }) : [];

    this.guard = guard;
    this.headers = new Map(init);
  }

  private checkGuard() {
    if (this.guard === 'immutable') {
      throw new TypeError('Header guard set to `immutable`');
    }
  }

  append(name: string, value: string): void {
    this.checkGuard();

    const key = name.toLowerCase();
    this.headers.set(key, (this.headers.get(key) || []).concat([value]));
  }
  delete(name: string): void {
    this.checkGuard();
    this.headers.delete(name.toLowerCase());
  };
  get(name: string): string | null {
    const values = this.headers.get(name.toLowerCase());
    return values ? values.join(', ') : null;
  };
  has(name: string): boolean {
    return this.headers.has(name.toLowerCase());
  };
  set(name: string, value: string): void {
    this.checkGuard();
    this.headers.set(name.toLowerCase(), [value]);
  };
  forEach(callbackfn: (value: string, key: string, parent: Headers) => void, thisArg?: any): void {
    this.headers.forEach((val, name) => {
      callbackfn.call(thisArg, this.get(name)!, name, this);
    })
  };

  *entries(): IterableIterator<[string, string]> {
    for (let key of this.headers.keys()) {
      yield [key, this.get(key)!];
    }
  }

  keys() {
    return this.headers.keys();
  }

  *values() {
    for (let key of this.headers.keys()) {
      yield this.get(key)!;
    }
  }

  [Symbol.iterator]() {
    return this.entries();
  }
}