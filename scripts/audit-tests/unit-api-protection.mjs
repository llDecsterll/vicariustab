/**
 * Unit tests: API rate limit + idempotency helpers
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  resetApiRateLimitBucketsForTests,
  apiIpRateLimit,
} from '../../server/apiRateLimit.ts';
import {
  resetIdempotencyStoreForTests,
  readIdempotencyKey,
} from '../../server/idempotency.ts';

function mockReq(method, path, headers = {}) {
  return {
    method,
    path,
    originalUrl: path,
    headers,
    socket: { remoteAddress: '127.0.0.1' },
  };
}

function mockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: undefined,
    status(n) {
      res.statusCode = n;
      return res;
    },
    json(b) {
      res.body = b;
      return res;
    },
    setHeader(k, v) {
      res.headers[k] = v;
    },
  };
  return res;
}

describe('apiRateLimit', () => {
  beforeEach(() => {
    resetApiRateLimitBucketsForTests();
    process.env.API_RATE_LIMIT_WINDOW_MS = '60000';
    process.env.API_RATE_LIMIT_READ_MAX = '3';
    process.env.API_RATE_LIMIT_WRITE_MAX = '2';
  });

  it('allows requests under read limit', () => {
    let nextCalls = 0;
    const next = () => {
      nextCalls += 1;
    };
    for (let i = 0; i < 3; i++) {
      apiIpRateLimit(mockReq('GET', '/api/data'), mockRes(), next);
    }
    assert.equal(nextCalls, 3);
  });

  it('blocks read requests over IP limit with 429', () => {
    const next = () => {};
    const res = mockRes();
    for (let i = 0; i < 4; i++) {
      apiIpRateLimit(mockReq('GET', '/api/data'), res, next);
    }
    assert.equal(res.statusCode, 429);
    assert.equal(res.body?.code, 'API_RATE_LIMITED');
  });

  it('exempts /api/health from throttling', () => {
    let nextCalls = 0;
    const next = () => {
      nextCalls += 1;
    };
    for (let i = 0; i < 10; i++) {
      apiIpRateLimit(mockReq('GET', '/api/health'), mockRes(), next);
    }
    assert.equal(nextCalls, 10);
  });
});

describe('idempotency helpers', () => {
  beforeEach(() => {
    resetIdempotencyStoreForTests();
  });

  it('readIdempotencyKey accepts Idempotency-Key header', () => {
    const key = readIdempotencyKey(
      mockReq('POST', '/api/data', { 'idempotency-key': 'save-abc-123' })
    );
    assert.equal(key, 'save-abc-123');
  });

  it('readIdempotencyKey accepts X-Idempotency-Key alias', () => {
    const key = readIdempotencyKey(
      mockReq('POST', '/api/data', { 'x-idempotency-key': 'alias-key-1' })
    );
    assert.equal(key, 'alias-key-1');
  });
});
