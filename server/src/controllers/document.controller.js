import * as docRepo from '../repositories/document.repository.js';

const VALID_TYPES = ['hoa_don', 'hop_dong', 'giay_to', 'bien_ban', 'khac'];

function validateDocumentBody({ title, type, description }, { requireAll = true } = {}) {
  const fields = {};

  if (requireAll || title !== undefined) {
    if (!title || !String(title).trim()) {
      fields.title = 'Tiêu đề không được để trống.';
    } else if (String(title).trim().length > 150) {
      fields.title = 'Tiêu đề tối đa 150 ký tự.';
    }
  }

  if (requireAll || type !== undefined) {
    if (!type) {
      fields.type = 'Loại tài liệu là bắt buộc.';
    } else if (!VALID_TYPES.includes(type)) {
      fields.type = `Loại tài liệu phải là một trong: ${VALID_TYPES.join(', ')}.`;
    }
  }

  if (description !== undefined && String(description).length > 500) {
    fields.description = 'Mô tả tối đa 500 ký tự.';
  }

  return Object.keys(fields).length ? fields : null;
}

// GET /api/documents
export async function listDocuments(req, res, next) {
  try {
    const pool = req.app.locals.pool;
    const { search, type, page, limit, sort } = req.query;
    const { rows, total } = await docRepo.findAll(pool, { search, type, page, limit, sort });
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const safePage = Math.max(Number(page) || 1, 1);
    return res.status(200).json({
      ok: true,
      data: {
        items: rows,
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/documents/:id
export async function getDocument(req, res, next) {
  try {
    const pool = req.app.locals.pool;
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(404).json({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'Tài liệu không tồn tại.' },
      });
    }
    const doc = await docRepo.findById(pool, id);
    if (!doc) {
      return res.status(404).json({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'Tài liệu không tồn tại.' },
      });
    }
    return res.status(200).json({ ok: true, data: doc });
  } catch (err) {
    next(err);
  }
}

// POST /api/documents
export async function createDocument(req, res, next) {
  try {
    const pool = req.app.locals.pool;
    const { title, type, description, owner_id } = req.body;
    const errors = validateDocumentBody({ title, type, description }, { requireAll: true });
    if (errors) {
      return res.status(422).json({
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ.', fields: errors },
      });
    }
    const ownerId = Number(owner_id) || 1;
    const doc = await docRepo.create(pool, {
      title: String(title).trim(),
      type,
      description: description ? String(description) : '',
      ownerId,
    });
    return res.status(201).json({ ok: true, data: doc });
  } catch (err) {
    next(err);
  }
}

// PUT /api/documents/:id
export async function updateDocument(req, res, next) {
  try {
    const pool = req.app.locals.pool;
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(404).json({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'Tài liệu không tồn tại.' },
      });
    }
    const { title, type, description } = req.body;
    const errors = validateDocumentBody({ title, type, description }, { requireAll: true });
    if (errors) {
      return res.status(422).json({
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ.', fields: errors },
      });
    }
    const doc = await docRepo.update(pool, id, {
      title: title !== undefined ? String(title).trim() : undefined,
      type,
      description: description !== undefined ? String(description) : undefined,
    });
    if (!doc) {
      return res.status(404).json({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'Tài liệu không tồn tại.' },
      });
    }
    return res.status(200).json({ ok: true, data: doc });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/documents/:id
export async function deleteDocument(req, res, next) {
  try {
    const pool = req.app.locals.pool;
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(404).json({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'Tài liệu không tồn tại.' },
      });
    }
    const deleted = await docRepo.remove(pool, id);
    if (!deleted) {
      return res.status(404).json({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'Tài liệu không tồn tại.' },
      });
    }
    return res.status(200).json({ ok: true, data: { id } });
  } catch (err) {
    next(err);
  }
}
