import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

function detectImage(buffer) {
  if (buffer?.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
  if (buffer?.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'png';
  return null;
}

function resolveStoredPath(storageRoot, relativePath) {
  const root = path.resolve(storageRoot);
  const absolutePath = path.resolve(root, relativePath);
  const relative = path.relative(root, absolutePath);
  if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    const error = new Error('Đường dẫn file không hợp lệ.');
    error.status = 400;
    error.code = 'INVALID_STORAGE_PATH';
    throw error;
  }
  return absolutePath;
}

export async function createUpload(req, res, next) {
  if (!req.file) {
    return res.status(422).json({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Vui lòng chọn một ảnh JPG hoặc PNG.' } });
  }
  const extension = detectImage(req.file.buffer);
  const declaredExtension = req.file.originalname.toLowerCase().split('.').pop();
  const matchesExtension = extension === 'jpg'
    ? declaredExtension === 'jpg' || declaredExtension === 'jpeg'
    : extension === 'png' && declaredExtension === 'png';
  if (!extension || !matchesExtension) {
    return res.status(415).json({ ok: false, error: { code: 'UNSUPPORTED_MEDIA', message: 'Nội dung ảnh không khớp với định dạng JPG hoặc PNG.' } });
  }

  const pool = req.app.locals.pool;
  const storageRoot = req.app.locals.storageRoot;
  const id = randomUUID();
  const relativePath = path.posix.join('uploads', `${id}.${extension}`);
  let absolutePath;
  let fileWritten = false;
  try {
    absolutePath = resolveStoredPath(storageRoot, relativePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, req.file.buffer, { flag: 'wx', mode: 0o600 });
    fileWritten = true;
    const result = await pool.query(
      `INSERT INTO uploads (id, owner_id, original_path)
       VALUES ($1, $2, $3)
       RETURNING id, created_at`,
      [id, req.user.id, relativePath]
    );
    return res.status(201).json({
      ok: true,
      data: { id: result.rows[0].id, created_at: result.rows[0].created_at, originalUrl: `/api/uploads/${id}/original` },
    });
  } catch (error) {
    if (fileWritten) await unlink(absolutePath).catch(() => {});
    return next(error);
  }
}

export async function getOriginalUpload(req, res, next) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(req.params.id);
  if (!isUuid) {
    return res.status(req.user.role === 'admin' ? 404 : 403).json({
      ok: false,
      error: req.user.role === 'admin'
        ? { code: 'NOT_FOUND', message: 'Ảnh tải lên không tồn tại.' }
        : { code: 'FORBIDDEN', message: 'Bạn không có quyền truy cập ảnh này.' },
    });
  }

  try {
    const result = await req.app.locals.pool.query(
      'SELECT owner_id, original_path FROM uploads WHERE id = $1',
      [req.params.id]
    );
    const upload = result.rows[0];
    if (!upload || (req.user.role !== 'admin' && upload.owner_id !== req.user.id)) {
      const forbidden = req.user.role !== 'admin';
      return res.status(forbidden ? 403 : 404).json({
        ok: false,
        error: forbidden
          ? { code: 'FORBIDDEN', message: 'Bạn không có quyền truy cập ảnh này.' }
          : { code: 'NOT_FOUND', message: 'Ảnh tải lên không tồn tại.' },
      });
    }

    const absolutePath = resolveStoredPath(req.app.locals.storageRoot, upload.original_path);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Content-Disposition', 'inline');
    return res.sendFile(absolutePath, (error) => {
      if (error && !res.headersSent) next(error);
    });
  } catch (error) {
    return next(error);
  }
}
