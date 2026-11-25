import assert from 'node:assert/strict';
import test from 'node:test';
import {
  listDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  bulkDeleteDocuments,
  copyDocument,
  bulkCopyDocuments,
  importDocuments,
} from './document.controller.js';

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

test('listDocuments returns 422 for invalid sort parameter', async () => {
  const req = {
    query: { sort: 'invalid_sort_column' },
    user: { id: 1, role: 'user' },
    app: { locals: { pool: {} } },
  };
  const res = createMockResponse();

  await listDocuments(req, res, () => {});

  assert.equal(res.statusCode, 422);
  assert.equal(res.body.ok, false);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  assert.ok(res.body.error.fields.sort);
});

test('listDocuments returns 422 for invalid page number', async () => {
  const req = {
    query: { page: '-5' },
    user: { id: 1, role: 'user' },
    app: { locals: { pool: {} } },
  };
  const res = createMockResponse();

  await listDocuments(req, res, () => {});

  assert.equal(res.statusCode, 422);
  assert.equal(res.body.ok, false);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  assert.ok(res.body.error.fields.page);
});

test('copyDocument returns 404 for invalid ID', async () => {
  const req = {
    params: { id: 'not_a_number' },
    user: { id: 1, role: 'user' },
    app: { locals: { pool: {} } },
  };
  const res = createMockResponse();

  await copyDocument(req, res, () => {});

  assert.equal(res.statusCode, 404);
  assert.equal(res.body.ok, false);
  assert.equal(res.body.error.code, 'NOT_FOUND');
});

test('bulkDeleteDocuments returns 422 when ids array is missing or empty', async () => {
  const req = {
    body: { ids: [] },
    user: { id: 1, role: 'user' },
    app: { locals: { pool: {} } },
  };
  const res = createMockResponse();

  await bulkDeleteDocuments(req, res, () => {});

  assert.equal(res.statusCode, 422);
  assert.equal(res.body.ok, false);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('bulkCopyDocuments returns 422 when ids array is missing or empty', async () => {
  const req = {
    body: { ids: [] },
    user: { id: 1, role: 'user' },
    app: { locals: { pool: {} } },
  };
  const res = createMockResponse();

  await bulkCopyDocuments(req, res, () => {});

  assert.equal(res.statusCode, 422);
  assert.equal(res.body.ok, false);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('importDocuments returns 422 when items array is empty', async () => {
  const req = {
    body: { items: [] },
    user: { id: 1, role: 'user' },
    app: { locals: { pool: {} } },
  };
  const res = createMockResponse();

  await importDocuments(req, res, () => {});

  assert.equal(res.statusCode, 422);
  assert.equal(res.body.ok, false);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('importDocuments detects invalid rows and returns validation summary', async () => {
  const req = {
    body: {
      items: [
        { title: '', type: 'hoa_don' }, // Invalid title
        { title: 'Hợp đồng A', type: 'invalid_type' }, // Invalid type
      ],
    },
    user: { id: 1, role: 'user' },
    app: { locals: { pool: {} } },
  };
  const res = createMockResponse();

  await importDocuments(req, res, () => {});

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.ok, true);
  assert.equal(res.body.data.totalReceived, 2);
  assert.equal(res.body.data.errorCount, 2);
  assert.equal(res.body.data.errors.length, 2);
});
