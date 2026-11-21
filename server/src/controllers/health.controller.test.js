import assert from 'node:assert/strict';
import test from 'node:test';
import { healthController } from './health.controller.js';

test('healthController returns the standard healthy API envelope', () => {
  const response = {
    statusCode: 0,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };

  healthController({}, response);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, { ok: true, data: { status: 'ok' } });
});
