import * as docRepo from '../repositories/document.repository.js';

const VALID_TYPES = ['hoa_don', 'hop_dong', 'giay_to', 'bien_ban', 'khac'];
const VALID_SORTS = ['created_at_desc', 'title_asc'];

function validateDocumentBody({ title, type, description }, { requireAll = true } = {}) {
  const fields = {};

  if (requireAll || title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) {
      fields.title = 'Tiêu đề không được để trống.';
    } else if (title.trim().length > 150) {
      fields.title = 'Tiêu đề tối đa 150 ký tự.';
    }
  }

  if (requireAll || type !== undefined) {
    if (typeof type !== 'string' || !type) {
      fields.type = 'Loại tài liệu là bắt buộc.';
    } else if (!VALID_TYPES.includes(type)) {
      fields.type = `Loại tài liệu phải là một trong: ${VALID_TYPES.join(', ')}.`;
    }
  }

  if (description !== undefined) {
    if (typeof description !== 'string') fields.description = 'Mô tả phải là văn bản.';
    else if (description.length > 500) fields.description = 'Mô tả tối đa 500 ký tự.';
  }

  return Object.keys(fields).length ? fields : null;
}

// GET /api/documents
export async function listDocuments(req, res, next) {
  try {
    const pool = req.app.locals.pool;
    const { search, type, page, limit, sort } = req.query;
    const fields = {};
    if (search !== undefined && (typeof search !== 'string' || search.length > 150)) {
      fields.search = 'Từ khóa tìm kiếm tối đa 150 ký tự.';
    }
    if (type !== undefined && type !== '' && (typeof type !== 'string' || !VALID_TYPES.includes(type))) {
      fields.type = 'Loại tài liệu không hợp lệ.';
    }
    if (page !== undefined && (typeof page !== 'string' || !/^[1-9]\d*$/.test(page) || !Number.isSafeInteger(Number(page)) || Number(page) > 1000000)) {
      fields.page = 'Trang phải là số nguyên dương.';
    }
    if (limit !== undefined && (typeof limit !== 'string' || !/^[1-9]\d*$/.test(limit) || Number(limit) > 100)) {
      fields.limit = 'Số dòng mỗi trang phải từ 1 đến 100.';
    }
    if (sort !== undefined && (typeof sort !== 'string' || !VALID_SORTS.includes(sort))) {
      fields.sort = 'Thứ tự sắp xếp không hợp lệ.';
    }
    if (Object.keys(fields).length) {
      return res.status(422).json({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Tham số truy vấn không hợp lệ.', fields } });
    }
    const { rows, total } = await docRepo.findAll(pool, {
      search, type, page, limit, sort,
      ownerId: req.user.role === 'admin' ? undefined : req.user.id,
    });
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
    const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
    const { title, type, description } = body;
    const errors = validateDocumentBody({ title, type, description }, { requireAll: true });
    if (errors) {
      return res.status(422).json({
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ.', fields: errors },
      });
    }
    const doc = await docRepo.create(pool, {
      title: String(title).trim(),
      type,
      description: description ? String(description) : '',
      ownerId: req.user.id,
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
    const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
    const { title, type, description } = body;
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
    }, req.user.role === 'admin' ? undefined : req.user.id);
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
    const deleted = await docRepo.remove(pool, id, req.user.role === 'admin' ? undefined : req.user.id);
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
