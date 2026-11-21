import assert from 'node:assert/strict';
import test from 'node:test';
import { listDocuments, getDocument, createDocument, updateDocument, deleteDocument } from './document.controller.js';

function createMockResponse() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test('getDocument returns 404 for invalid ID', async () => {
  const req = {
    params: { id: 'abc' },
    app: { locals: { pool: {} } },
  };
  const res = createMockResponse();
  let nextCalled = false;

  await getDocument(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 404);
  assert.equal(res.body.ok, false);
  assert.equal(res.body.error.code, 'NOT_FOUND');
});

test('createDocument returns 422 when title is empty', async () => {
  const req = {
    body: { title: '', type: 'hoa_don' },
    app: { locals: { pool: {} } },
  };
  const res = createMockResponse();

  await createDocument(req, res, () => {});

  assert.equal(res.statusCode, 422);
  assert.equal(res.body.ok, false);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  assert.ok(res.body.error.fields.title);
});

test('createDocument returns 422 when type is invalid', async () => {
  const req = {
    body: { title: 'Hóa đơn tháng 1', type: 'invalid_type' },
    app: { locals: { pool: {} } },
  };
  const res = createMockResponse();

  await createDocument(req, res, () => {});

  assert.equal(res.statusCode, 422);
  assert.equal(res.body.ok, false);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  assert.ok(res.body.error.fields.type);
});
