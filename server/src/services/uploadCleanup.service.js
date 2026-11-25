import { unlink } from 'node:fs/promises';
import path from 'node:path';

function storedPath(root, relative) {
  if (typeof relative !== 'string' || !relative) return null;
  const absolute = path.resolve(root, relative);
  const fromRoot = path.relative(path.resolve(root), absolute);
  if (!fromRoot || fromRoot === '..' || fromRoot.startsWith(`..${path.sep}`) || path.isAbsolute(fromRoot)) return null;
  return absolute;
}

export async function cleanupExpiredUploads(pool, storageRoot) {
  const result = await pool.query(
    `DELETE FROM uploads
     WHERE id IN (
       SELECT id FROM uploads
       WHERE document_id IS NULL AND created_at < NOW() - INTERVAL '24 hours'
       FOR UPDATE SKIP LOCKED
     )
     RETURNING original_path, processed_path, step_paths`);
  const removed = await Promise.all(result.rows.flatMap((row) => {
    const steps = Array.isArray(row.step_paths) ? row.step_paths : [];
    return [row.original_path, row.processed_path, ...steps]
      .map((item) => storedPath(storageRoot, item))
      .filter(Boolean)
      .map((file) => unlink(file).catch((error) => {
        if (error.code !== 'ENOENT') throw error;
      }));
  }));
  return { uploads: result.rowCount ?? result.rows.length, files: removed.length };
}

export function scheduleUploadCleanup(pool, storageRoot, intervalMs = 60 * 60 * 1000) {
  const run = () => cleanupExpiredUploads(pool, storageRoot).catch((error) => {
    console.error('Không thể dọn upload hết hạn:', error.message);
  });
  void run();
  const timer = setInterval(run, intervalMs);
  timer.unref();
  return () => clearInterval(timer);
}
