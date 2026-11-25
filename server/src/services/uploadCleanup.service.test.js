import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanupExpiredUploads } from './uploadCleanup.service.js';

test('cleanup deletes only expired unlinked uploads and reports removed records', async () => {
  let sql = '';
  const pool = { query: async (statement) => {
    sql = statement;
    return { rowCount: 1, rows: [{ original_path: 'uploads/old.jpg', processed_path: null, step_paths: [] }] };
  } };
  const result = await cleanupExpiredUploads(pool, 'C:/private/smartscan');
  assert.match(sql, /document_id IS NULL/);
  assert.match(sql, /INTERVAL '24 hours'/);
  assert.deepEqual(result, { uploads: 1, files: 1 });
});

test('cleanup ignores unsafe paths returned from malformed rows', async () => {
  const pool = { query: async () => ({ rowCount: 1, rows: [
    { original_path: '../outside.jpg', processed_path: null, step_paths: [] },
  ] }) };
  const result = await cleanupExpiredUploads(pool, 'C:/private/smartscan');
  assert.deepEqual(result, { uploads: 1, files: 0 });
});
