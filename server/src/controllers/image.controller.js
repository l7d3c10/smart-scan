import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { projectRoot } from '../config/env.js';
import { runImageProcessor, validateImageOptions } from '../services/imageProcessing.service.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TYPES = new Set(['hoa_don', 'hop_dong', 'giay_to', 'bien_ban', 'khac']);

function httpError(status, code, message) {
  return Object.assign(new Error(message), { status, code });
}

function safePath(root, relative) {
  const absolute = path.resolve(root, relative);
  const fromRoot = path.relative(path.resolve(root), absolute);
  if (!fromRoot || fromRoot === '..' || fromRoot.startsWith(`..${path.sep}`) || path.isAbsolute(fromRoot)) {
    throw httpError(400, 'INVALID_STORAGE_PATH', 'Đường dẫn ảnh không hợp lệ.');
  }
  return absolute;
}

async function ownedUpload(req, executor = req.app.locals.pool, lock = false) {
  if (!UUID.test(req.params.id)) throw httpError(404, 'NOT_FOUND', 'Ảnh tải lên không tồn tại.');
  const result = await executor.query(
    `SELECT id, owner_id, original_path, processed_path, step_paths, mode, document_id
     FROM uploads WHERE id = $1${lock ? ' FOR UPDATE' : ''}`, [req.params.id]);
  const upload = result.rows[0];
  if (!upload || (req.user.role !== 'admin' && upload.owner_id !== req.user.id)) {
    throw httpError(req.user.role === 'admin' ? 404 : 403,
      req.user.role === 'admin' ? 'NOT_FOUND' : 'FORBIDDEN',
      req.user.role === 'admin' ? 'Ảnh tải lên không tồn tại.' : 'Bạn không có quyền truy cập ảnh này.');
  }
  return upload;
}

export async function processUpload(req, res, next) {
  try {
    const checked = validateImageOptions(req.body);
    if (checked.error) throw httpError(422, 'VALIDATION_ERROR', checked.error);
    const upload = await ownedUpload(req);
    const root = req.app.locals.storageRoot;
    const outputRelative = path.posix.join('processed', upload.id, `${checked.mode}.png`);
    const stepsRelative = path.posix.join('processed', upload.id, 'steps');
    const outputPath = safePath(root, outputRelative);
    const stepsDir = safePath(root, stepsRelative);
    const inputPath = safePath(root, upload.original_path);
    await mkdir(path.dirname(outputPath), { recursive: true });
    const result = await runImageProcessor({
      pythonExecutable: req.app.locals.pythonExecutable || 'python',
      scriptPath: path.join(projectRoot, 'server/python/process.py'),
      inputPath, outputPath, stepsDir, mode: checked.mode, options: checked.options,
    });
    const stepPaths = result.steps.map((_, index) => path.posix.join(stepsRelative,
      ['01-gray-blur.png', '02-canny.png', '03-contour.png', '04-rectified.png'][index]));
    await req.app.locals.pool.query(
      `UPDATE uploads SET processed_path = $1, step_paths = $2::jsonb,
       mode = $3, params = $4::jsonb, warning = $5 WHERE id = $6`,
      [outputRelative, JSON.stringify(stepPaths), checked.mode, JSON.stringify(checked.options), result.warning, upload.id]);
    return res.json({ ok: true, data: {
      found: result.found, warning: result.warning, width: result.width, height: result.height,
      resultUrl: `/api/uploads/${upload.id}/processed`,
      steps: stepPaths.map((_, index) => ({
        label: ['Ảnh xám và làm mờ', 'Cạnh Canny', 'Viền tài liệu', 'Ảnh sau nắn'][index],
        url: `/api/uploads/${upload.id}/steps/${index}`,
      })),
    } });
  } catch (error) { return next(error); }
}

export async function getUploadImage(req, res, next) {
  try {
    const upload = await ownedUpload(req);
    let relative;
    if (req.params.asset === 'original') relative = upload.original_path;
    else if (req.params.asset === 'processed') relative = upload.processed_path;
    else if (req.params.asset === 'steps' && /^\d$/.test(req.params.index || '')) {
      const steps = Array.isArray(upload.step_paths) ? upload.step_paths : JSON.parse(upload.step_paths || '[]');
      relative = steps[Number(req.params.index)];
    }
    if (!relative) throw httpError(404, 'NOT_FOUND', 'Ảnh không tồn tại.');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Content-Disposition', 'inline');
    return res.sendFile(safePath(req.app.locals.storageRoot, relative), (error) => {
      if (error && !res.headersSent) next(error);
    });
  } catch (error) { return next(error); }
}

export async function saveUpload(req, res, next) {
  const client = await req.app.locals.pool.connect();
  try {
    await client.query('BEGIN');
    const upload = await ownedUpload(req, client, true);
    if (!upload.processed_path) throw httpError(409, 'IMAGE_NOT_PROCESSED', 'Hãy xử lý ảnh trước khi lưu.');
    const { title, type, description = '', documentId } = req.body || {};
    let document;
    if (documentId !== undefined && documentId !== null && documentId !== '') {
      if (!/^\d+$/.test(String(documentId))) throw httpError(422, 'VALIDATION_ERROR', 'Mã tài liệu không hợp lệ.');
      const updated = await client.query(
        `UPDATE documents SET original_path = $1, processed_path = $2, process_mode = $3, updated_at = NOW()
         WHERE id = $4 AND ($5::int IS NULL OR owner_id = $5) RETURNING id, code, title`,
        [upload.original_path, upload.processed_path, upload.mode, Number(documentId), req.user.role === 'admin' ? null : req.user.id]);
      document = updated.rows[0];
      if (!document) throw httpError(404, 'NOT_FOUND', 'Tài liệu không tồn tại hoặc bạn không có quyền sửa.');
    } else {
      if (typeof title !== 'string' || !title.trim() || title.trim().length > 150 || !TYPES.has(type)) {
        throw httpError(422, 'VALIDATION_ERROR', 'Tên tài liệu và loại tài liệu không hợp lệ.');
      }
      const inserted = await client.query(
        `INSERT INTO documents (code, title, type, description, owner_id, original_path, processed_path, process_mode)
         VALUES ('TL-' || LPAD(nextval('document_code_seq')::text, 4, '0'), $1, $2, $3, $4, $5, $6, $7)
         RETURNING id, code, title`,
        [title.trim(), type, String(description).slice(0, 500), req.user.id,
          upload.original_path, upload.processed_path, upload.mode]);
      document = inserted.rows[0];
    }
    const linked = await client.query('UPDATE uploads SET document_id = $1 WHERE id = $2', [document.id, upload.id]);
    if (linked.rowCount !== 1) throw httpError(409, 'UPLOAD_EXPIRED', 'Ảnh tải lên đã hết hạn.');
    await client.query('COMMIT');
    return res.status(201).json({ ok: true, data: { document } });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    return next(error);
  } finally { client.release(); }
}

export async function getDocumentImage(req, res, next) {
  try {
    const documentId = Number(req.params.id);
    if (!Number.isInteger(documentId) || documentId < 1) throw httpError(404, 'NOT_FOUND', 'Ảnh không tồn tại.');
    if (!['original', 'processed'].includes(req.params.kind)) throw httpError(404, 'NOT_FOUND', 'Ảnh không tồn tại.');
    const result = await req.app.locals.pool.query(
      `SELECT ${req.params.kind === 'original' ? 'original_path' : 'processed_path'} AS image_path
       FROM documents WHERE id = $1`, [documentId]);
    const relative = result.rows[0]?.image_path;
    if (!relative) throw httpError(404, 'NOT_FOUND', 'Ảnh không tồn tại.');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Content-Disposition', 'inline');
    return res.sendFile(safePath(req.app.locals.storageRoot, relative), (error) => {
      if (error && !res.headersSent) next(error);
    });
  } catch (error) { return next(error); }
}
