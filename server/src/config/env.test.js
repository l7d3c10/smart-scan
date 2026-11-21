import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import { loadConfig, projectRoot } from './env.js';

const requiredEnv = {
  DATABASE_URL: 'postgresql://localhost/smartscan',
  SESSION_SECRET: 'a-random-secret-for-local-development-only',
};

test('loadConfig resolves a project-relative Python executable', () => {
  const relativePythonPath = 'server/python/.venv/Scripts/python.exe';

  const config = loadConfig({
    ...requiredEnv,
    PYTHON_EXECUTABLE: relativePythonPath,
  });

  assert.equal(config.pythonExecutable, path.resolve(projectRoot, relativePythonPath));
});

test('loadConfig reports missing required environment keys without values', () => {
  assert.throws(
    () => loadConfig({}),
    (error) => error.message === 'Thiếu biến môi trường bắt buộc: DATABASE_URL, SESSION_SECRET',
  );
});
