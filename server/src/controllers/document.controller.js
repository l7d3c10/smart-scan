import * as docRepo from '../repositories/document.repository.js';

const VALID_TYPES = ['hoa_don', 'hop_dong', 'giay_to', 'bien_ban', 'khac'];
const VALID_SORTS = [
  'created_at_desc', 'created_at_asc',
  'title_asc', 'title_desc',
  'code_asc', 'code_desc',
  'type_asc', 'type_desc',
];

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
    const { search, type, page, limit, sort, isFavorite, isDeleted, folderName } = req.query;
    const fields = {};
    if (search !== undefined && (typeof search !== 'string' || search.length > 150)) {
      fields.search = 'Từ khóa tìm kiếm tối đa 150 ký tự.';
    }
    if (type !== undefined && type !== '' && (typeof type !== 'string' || !VALID_TYPES.includes(type))) {
      fields.type = 'Loại tài liệu không hợp lệ.';
    }
    if (page !== undefined && (typeof page !== 'string' || !/^[1-9]\d*$/.test(page) || Number(page) > 1000000)) {
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

    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
    const safePage = Math.max(Number(page) || 1, 1);

    const { rows, total } = await docRepo.findAll(pool, {
      search,
      type,
      page: safePage,
      limit: safeLimit,
      sort: sort || 'created_at_desc',
      ownerId: req.user.role === 'admin' ? undefined : req.user.id,
      isFavorite: isFavorite === 'true' || isFavorite === true,
      isDeleted: isDeleted === 'true' || isDeleted === true,
      folderName,
    });

    return res.status(200).json({
      ok: true,
      data: {
        items: rows,
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/documents/folders
export async function getFolders(req, res, next) {
  try {
    const pool = req.app.locals.pool;
    const folders = await docRepo.getFolderStats(pool, req.user.role === 'admin' ? undefined : req.user.id);
    return res.status(200).json({ ok: true, data: folders });
  } catch (err) {
    next(err);
  }
}

// GET /api/documents/processed-images
export async function getProcessedImages(req, res, next) {
  try {
    const ownerCondition = req.user.role === 'admin' ? '' : 'AND owner_id = $1';
    const params = req.user.role === 'admin' ? [] : [req.user.id];
    const result = await req.app.locals.pool.query(
      `SELECT id, code, title, original_path IS NOT NULL AS has_original
       FROM documents
       WHERE processed_path IS NOT NULL AND COALESCE(is_deleted, FALSE) = FALSE ${ownerCondition}
       ORDER BY updated_at DESC LIMIT 100`, params);
    return res.json({ ok: true, data: result.rows.map((row) => ({
      id: row.id, code: row.code, title: row.title, hasOriginal: row.has_original,
      imageUrl: `/api/documents/${row.id}/image/processed`,
      downloadUrl: `/api/documents/${row.id}/image/processed?download=1`,
    })) });
  } catch (error) { return next(error); }
}

// POST /api/documents/folders
export async function createFolder(req, res, next) {
  try {
    const pool = req.app.locals.pool;
    const { name, description } = req.body || {};
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(422).json({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Tên thư mục không được để trống.' } });
    }
    if (name.trim().length > 150) {
      return res.status(422).json({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Tên thư mục tối đa 150 ký tự.' } });
    }
    const folder = await docRepo.createFolder(pool, {
      name: name.trim(),
      description: (description || '').trim().slice(0, 500),
      ownerId: req.user.role === 'admin' ? null : req.user.id,
    });
    return res.status(201).json({ ok: true, data: folder });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/documents/folders/:name
export async function deleteFolder(req, res, next) {
  try {
    const pool = req.app.locals.pool;
    const name = decodeURIComponent(req.params.name);
    if (!name || name === 'Tài liệu nội bộ') {
      return res.status(400).json({ ok: false, error: { code: 'FORBIDDEN', message: 'Không thể xóa thư mục mặc định của hệ thống.' } });
    }
    const success = await docRepo.deleteFolder(pool, name, req.user.role === 'admin' ? undefined : req.user.id);
    if (!success) {
      return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Thư mục không tồn tại.' } });
    }
    return res.status(200).json({ ok: true, data: { message: `Đã xóa thư mục ${name} thành công.` } });
  } catch (err) {
    next(err);
  }
}

// GET /api/documents/next-code
export async function getNextCode(req, res, next) {
  try {
    const pool = req.app.locals.pool;
    const nextCode = await docRepo.getNextExpectedCode(pool);
    return res.status(200).json({ ok: true, data: { nextCode } });
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

// GET /api/documents/:id/history
export async function getDocumentHistory(req, res, next) {
  try {
    const pool = req.app.locals.pool;
    const id = Number(req.params.id);
    const history = await docRepo.getDocumentHistory(pool, id);
    return res.status(200).json({ ok: true, data: history });
  } catch (err) {
    next(err);
  }
}

// POST /api/documents
export async function createDocument(req, res, next) {
  try {
    const pool = req.app.locals.pool;
    const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
    const { title, type, description, folderName } = body;
    const errors = validateDocumentBody({ title, type, description }, { requireAll: true });
    if (errors) {
      return res.status(422).json({
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ.', fields: errors },
      });
    }
    let imagePaths = {};
    if (body.imageSourceId !== undefined && body.imageSourceId !== null && body.imageSourceId !== '') {
      const sourceId = Number(body.imageSourceId);
      if (!Number.isInteger(sourceId) || sourceId < 1) {
        return res.status(422).json({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Ảnh nguồn không hợp lệ.' } });
      }
      const source = await pool.query(
        `SELECT owner_id, original_path, processed_path, process_mode FROM documents
         WHERE id = $1 AND processed_path IS NOT NULL AND COALESCE(is_deleted, FALSE) = FALSE
           AND ($2::int IS NULL OR owner_id = $2)`,
        [sourceId, req.user.role === 'admin' ? null : req.user.id]);
      if (!source.rows[0]) {
        return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Ảnh đã xử lý không tồn tại hoặc bạn không có quyền sử dụng.' } });
      }
      imagePaths = { originalPath: source.rows[0].original_path, processedPath: source.rows[0].processed_path,
        processMode: source.rows[0].process_mode };
    }
    const doc = await docRepo.create(pool, {
      title: String(title).trim(),
      type,
      description: description ? String(description) : '',
      ownerId: req.user.id,
      ...imagePaths,
      folderName: folderName || 'Tài liệu nội bộ',
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
    const { title, type, description, folderName } = body;
    const errors = validateDocumentBody({ title, type, description }, { requireAll: false });
    if (errors) {
      return res.status(422).json({
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ.', fields: errors },
      });
    }
    let imagePaths = {};
    if (body.imageSourceId !== undefined && body.imageSourceId !== null && body.imageSourceId !== '') {
      const sourceId = Number(body.imageSourceId);
      if (!Number.isInteger(sourceId) || sourceId < 1) {
        return res.status(422).json({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Ảnh nguồn không hợp lệ.' } });
      }
      const source = await pool.query(
        `SELECT owner_id, original_path, processed_path, process_mode FROM documents
         WHERE id = $1 AND processed_path IS NOT NULL AND COALESCE(is_deleted, FALSE) = FALSE
           AND ($2::int IS NULL OR owner_id = $2)`,
        [sourceId, req.user.role === 'admin' ? null : req.user.id]);
      if (!source.rows[0]) {
        return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Ảnh đã xử lý không tồn tại hoặc bạn không có quyền sử dụng.' } });
      }
      imagePaths = { originalPath: source.rows[0].original_path, processedPath: source.rows[0].processed_path,
        processMode: source.rows[0].process_mode };
    }
    const doc = await docRepo.update(pool, id, {
      title: title !== undefined ? String(title).trim() : undefined,
      type,
      description: description !== undefined ? String(description) : undefined,
      ...imagePaths,
      folderName,
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

// DELETE /api/documents/:id (Permanent Delete)
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

// POST /api/documents/:id/favorite
export async function toggleFavorite(req, res, next) {
  try {
    const pool = req.app.locals.pool;
    const id = Number(req.params.id);
    const updated = await docRepo.toggleFavorite(pool, id, req.user.role === 'admin' ? undefined : req.user.id);
    if (!updated) {
      return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Tài liệu không tồn tại.' } });
    }
    return res.status(200).json({ ok: true, data: updated });
  } catch (err) {
    next(err);
  }
}

// POST /api/documents/:id/trash (Soft delete / Move to recycle bin)
export async function moveToTrash(req, res, next) {
  try {
    const pool = req.app.locals.pool;
    const id = Number(req.params.id);
    const updated = await docRepo.moveToTrash(pool, id, req.user.role === 'admin' ? undefined : req.user.id);
    if (!updated) {
      return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Tài liệu không tồn tại.' } });
    }
    return res.status(200).json({ ok: true, data: updated });
  } catch (err) {
    next(err);
  }
}

// POST /api/documents/:id/restore (Restore from recycle bin)
export async function restoreFromTrash(req, res, next) {
  try {
    const pool = req.app.locals.pool;
    const id = Number(req.params.id);
    const updated = await docRepo.restoreFromTrash(pool, id, req.user.role === 'admin' ? undefined : req.user.id);
    if (!updated) {
      return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Tài liệu không tồn tại.' } });
    }
    return res.status(200).json({ ok: true, data: updated });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/documents/trash/empty
export async function emptyTrash(req, res, next) {
  try {
    const pool = req.app.locals.pool;
    const count = await docRepo.emptyTrash(pool, req.user.role === 'admin' ? undefined : req.user.id);
    return res.status(200).json({ ok: true, data: { deletedCount: count } });
  } catch (err) {
    next(err);
  }
}

// POST /api/documents/:id/move
export async function moveDocument(req, res, next) {
  try {
    const pool = req.app.locals.pool;
    const id = Number(req.params.id);
    const { folderName } = req.body || {};
    if (!folderName) {
      return res.status(422).json({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Vui lòng chọn thư mục đích.' } });
    }
    const updated = await docRepo.moveToFolder(pool, id, folderName, req.user.role === 'admin' ? undefined : req.user.id);
    return res.status(200).json({ ok: true, data: updated });
  } catch (err) {
    next(err);
  }
}

// POST /api/documents/bulk-delete
export async function bulkDeleteDocuments(req, res, next) {
  try {
    const pool = req.app.locals.pool;
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(422).json({
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'Danh sách ID không hợp lệ.' },
      });
    }
    const validIds = ids.map(Number).filter((id) => Number.isInteger(id) && id > 0);
    const count = await docRepo.bulkRemove(pool, validIds, req.user.role === 'admin' ? undefined : req.user.id);
    return res.status(200).json({ ok: true, data: { deletedCount: count } });
  } catch (err) {
    next(err);
  }
}

// POST /api/documents/:id/copy
export async function copyDocument(req, res, next) {
  try {
    const pool = req.app.locals.pool;
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(404).json({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'Tài liệu không tồn tại.' },
      });
    }
    const { title, folderName } = req.body && typeof req.body === 'object' ? req.body : {};
    const newDoc = await docRepo.copy(
      pool,
      id,
      req.user.role === 'admin' ? undefined : req.user.id,
      { title, folderName }
    );
    if (!newDoc) {
      return res.status(404).json({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'Không thể sao chép tài liệu này.' },
      });
    }
    return res.status(201).json({ ok: true, data: newDoc });
  } catch (err) {
    next(err);
  }
}

// POST /api/documents/bulk-copy
export async function bulkCopyDocuments(req, res, next) {
  try {
    const pool = req.app.locals.pool;
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(422).json({
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'Danh sách ID không hợp lệ.' },
      });
    }
    const validIds = ids.map(Number).filter((id) => Number.isInteger(id) && id > 0);
    const copied = await docRepo.bulkCopy(pool, validIds, req.user.role === 'admin' ? undefined : req.user.id);
    return res.status(201).json({ ok: true, data: { items: copied, count: copied.length } });
  } catch (err) {
    next(err);
  }
}

// POST /api/documents/import
export async function importDocuments(req, res, next) {
  try {
    const pool = req.app.locals.pool;
    const { items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(422).json({
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'Dữ liệu nhập trống.' },
      });
    }

    const validItems = [];
    const errorRows = [];

    items.forEach((item, index) => {
      const rowNum = index + 1;
      const title = String(item.title || '').trim();
      const type = String(item.type || '').trim().toLowerCase();
      const description = String(item.description || '').trim();

      if (!title) {
        errorRows.push({ row: rowNum, column: 'title', message: 'Tiêu đề không được để trống' });
        return;
      }
      if (title.length > 150) {
        errorRows.push({ row: rowNum, column: 'title', message: 'Tiêu đề vượt quá 150 ký tự' });
        return;
      }
      if (!VALID_TYPES.includes(type)) {
        errorRows.push({ row: rowNum, column: 'type', message: `Loại phải là một trong: ${VALID_TYPES.join(', ')}` });
        return;
      }
      if (description.length > 500) {
        errorRows.push({ row: rowNum, column: 'description', message: 'Mô tả vượt quá 500 ký tự' });
        return;
      }

      validItems.push({ title, type, description });
    });

    let inserted = [];
    if (validItems.length > 0) {
      inserted = await docRepo.importDocuments(pool, validItems, req.user.id);
    }

    return res.status(200).json({
      ok: true,
      data: {
        totalReceived: items.length,
        insertedCount: inserted.length,
        errorCount: errorRows.length,
        errors: errorRows,
      },
    });
  } catch (err) {
    next(err);
  }
}


export async function exportDocuments(req, res, next) {
  try {
    const pool = req.app.locals.pool;
    const { search = '', type = '' } = req.query;

    // Lấy toàn bộ tài liệu không phân trang để xuất
    const result = await docRepo.list(pool, {
      search,
      type,
      page: 1,
      limit: 10000,
      sort: 'created_at_desc',
      userId: req.user?.id,
      isAdmin: req.user?.role === 'admin',
    });

    return res.status(200).json({
      ok: true,
      data: result.items || [],
      total: result.total || 0,
      exportedAt: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}
