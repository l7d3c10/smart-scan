import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const projectRoot = fileURLToPath(new URL('../../../', import.meta.url));

export function loadConfig(env = process.env) {
  const missing = ['DATABASE_URL', 'SESSION_SECRET'].filter((key) => !env[key]?.trim());

  if (missing.length > 0) {
    throw new Error(`Thiếu biến môi trường bắt buộc: ${missing.join(', ')}`);
  }

  const port = Number(env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT phải là số nguyên từ 1 đến 65535.');
  }

  const pythonExecutable = env.PYTHON_EXECUTABLE || 'python';
  const resolvedPythonExecutable = path.isAbsolute(pythonExecutable)
    || !/[\\/]/.test(pythonExecutable)
    ? pythonExecutable
    : path.resolve(projectRoot, pythonExecutable);

  return {
    port,
    databaseUrl: env.DATABASE_URL,
    sessionSecret: env.SESSION_SECRET,
    storageRoot: path.resolve(projectRoot, env.STORAGE_ROOT || 'server/storage'),
    pythonExecutable: resolvedPythonExecutable,
  };
}
