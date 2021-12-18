/**
 * We're running in an ESM context so we need to import nock first otherwise
 * it won't be able to patch the `http` module in the tests
 */
import "nock";
