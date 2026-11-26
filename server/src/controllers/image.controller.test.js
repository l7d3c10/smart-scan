import assert from 'node:assert/strict';
import test from 'node:test';
import { getUploadDraft } from './image.controller.js';

function response() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test('getUploadDraft restores saved mode, parameters, result and processing steps', async () => {
  const uploadId = '8be0a8ab-418a-4bbc-8de3-20354ec6ca87';
  let query;
  const req = {
    params: { id: uploadId },
    user: { id: 7, role: 'user' },
    app: { locals: { pool: { query: async (...args) => {
      query = args;
      return { rows: [{
        id: uploadId, owner_id: 7, original_path: 'original/input.png',
        processed_path: 'processed/output.png',
        step_paths: ['steps/1.png', 'steps/2.png', 'steps/3.png', 'steps/4.png'],
        mode: 'bw', params: { cannyLow: 40, cannyHigh: 130, kernel: 7, blockSize: 15 }, warning: null,
      }] };
    } } } },
  };
  const res = response();
  let nextError;

  await getUploadDraft(req, res, (error) => { nextError = error; });

  assert.equal(nextError, undefined);
  assert.match(query[0], /params, warning/);
  assert.deepEqual(query[1], [uploadId]);
  assert.equal(res.body.data.mode, 'bw');
  assert.deepEqual(res.body.data.params, { cannyLow: 40, cannyHigh: 130, kernel: 7, blockSize: 15 });
  assert.equal(res.body.data.originalUrl, `/api/uploads/${uploadId}/original`);
  assert.equal(res.body.data.resultUrl, `/api/uploads/${uploadId}/processed`);
  assert.equal(res.body.data.steps.length, 4);
});
