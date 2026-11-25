import path from 'node:path';
import { existsSync } from 'node:fs';
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

  const virtualenvPython = path.join(projectRoot, 'server', 'python', '.venv',
    process.platform === 'win32' ? 'Scripts' : 'bin',
    process.platform === 'win32' ? 'python.exe' : 'python');
  const pythonExecutable = env.PYTHON_EXECUTABLE || (existsSync(virtualenvPython) ? virtualenvPython : 'python');
  const resolvedPythonExecutable = path.isAbsolute(pythonExecutable)
    || !/[\\/]/.test(pythonExecutable)
    ? pythonExecutable
    : path.resolve(projectRoot, pythonExecutable);

  return {
    port,
    databaseUrl: env.DATABASE_URL,
    sessionSecret: env.SESSION_SECRET,
    clientOrigin: env.CLIENT_ORIGIN || 'http://localhost:5173',
    storageRoot: path.resolve(projectRoot, env.STORAGE_ROOT || 'server/storage'),
    pythonExecutable: resolvedPythonExecutable,
  };
}
