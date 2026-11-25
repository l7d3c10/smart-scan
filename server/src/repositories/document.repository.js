// Document Repository – raw SQL, parameterized queries only.
// All functions accept `pool` as first argument.

const VALID_TYPES = ['hoa_don', 'hop_dong', 'giay_to', 'bien_ban', 'khac'];

const TYPE_LABELS = {
  hoa_don: 'Hóa đơn',
  hop_dong: 'Hợp đồng',
  giay_to: 'Giấy tờ',
  bien_ban: 'Biên bản',
  khac: 'Khác',
};

function mapRow(row) {
  if (!row) return null;
  const isCopy = (row.title && row.title.includes('(Bản sao)')) ||
                 (row.description && row.description.includes('[Bản sao'));
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    type: row.type,
    type_label: TYPE_LABELS[row.type] ?? row.type,
    description: row.description ?? '',
    original_path: row.original_path ?? null,
    processed_path: row.processed_path ?? null,
    process_mode: row.process_mode ?? null,
    owner_id: row.owner_id,
    owner_username: row.owner_username ?? `Người dùng #${row.owner_id}`,
    is_copy: Boolean(isCopy),
    is_favorite: Boolean(row.is_favorite),
    is_deleted: Boolean(row.is_deleted),
    folder_name: row.folder_name || 'Tài liệu nội bộ',
    deleted_at: row.deleted_at ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * findAll – paginated list with multi-field keyword search, sort, and filters.
 */
export async function findAll(pool, {
  search,
  type,
  page = 1,
  limit = 10,
  sort = 'created_at_desc',
  ownerId,
  isFavorite,
  folderName,
  isDeleted = false,
} = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const params = [];
  const conditions = [];

  // Filter soft-deleted
  if (isDeleted) {
    conditions.push(`d.is_deleted = TRUE`);
  } else {
    conditions.push(`(d.is_deleted IS NULL OR d.is_deleted = FALSE)`);
  }

  // Filter favorite
  if (isFavorite) {
    conditions.push(`d.is_favorite = TRUE`);
  }

  // Filter folder
  if (folderName && folderName.trim()) {
    params.push(folderName.trim());
    conditions.push(`d.folder_name = $${params.length}`);
  }

  // Keyword / Token search across code, title, description and type
  if (search && search.trim()) {
    const rawQuery = search.trim();
    const tokens = rawQuery.split(/\s+/).filter(Boolean);
    const tokenConditions = [];

    params.push(`%${rawQuery}%`);
    const fullParamIdx = params.length;
    tokenConditions.push(`(
      d.code ILIKE $${fullParamIdx} OR
      d.title ILIKE $${fullParamIdx} OR
      d.description ILIKE $${fullParamIdx} OR
      d.type ILIKE $${fullParamIdx}
    )`);

    if (tokens.length > 1) {
      tokens.forEach((token) => {
        params.push(`%${token}%`);
        const tokenIdx = params.length;
        tokenConditions.push(`(
          d.code ILIKE $${tokenIdx} OR
          d.title ILIKE $${tokenIdx} OR
          d.description ILIKE $${tokenIdx}
        )`);
      });
    }

    conditions.push(`(${tokenConditions.join(' OR ')})`);
  }

  if (type && VALID_TYPES.includes(type)) {
    params.push(type);
    conditions.push(`d.type = $${params.length}`);
  }

  if (ownerId !== undefined) {
    params.push(ownerId);
    conditions.push(`d.owner_id = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  // Sort mapping allowlist
  let orderBy = 'd.created_at DESC';
  switch (sort) {
    case 'created_at_asc': orderBy = 'd.created_at ASC'; break;
    case 'created_at_desc': orderBy = 'd.created_at DESC'; break;
    case 'title_asc': orderBy = 'd.title ASC'; break;
    case 'title_desc': orderBy = 'd.title DESC'; break;
    case 'code_asc': orderBy = 'd.code ASC'; break;
    case 'code_desc': orderBy = 'd.code DESC'; break;
    case 'type_asc': orderBy = 'd.type ASC'; break;
    case 'type_desc': orderBy = 'd.type DESC'; break;
    default: orderBy = 'd.created_at DESC';
  }

  // Count query
  const countRes = await pool.query(
    `SELECT COUNT(*) AS total FROM documents d ${where}`,
    params
  );
  const total = Number(countRes.rows[0].total);

  // Data query with join for owner username
  const dataParams = [...params, safeLimit, offset];
  const dataRes = await pool.query(
    `SELECT d.*, u.username AS owner_username 
     FROM documents d
     LEFT JOIN users u ON d.owner_id = u.id
     ${where} 
     ORDER BY ${orderBy} 
     LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
    dataParams
  );

  return { rows: dataRes.rows.map(mapRow), total };
}

/**
 * findById – returns single document or null with owner info.
 */
export async function findById(pool, id) {
  const res = await pool.query(
    `SELECT d.*, u.username AS owner_username 
     FROM documents d
     LEFT JOIN users u ON d.owner_id = u.id
     WHERE d.id = $1`,
    [id]
  );
  return res.rows.length ? mapRow(res.rows[0]) : null;
}

/**
 * toggleFavorite – toggles is_favorite status.
 */
export async function toggleFavorite(pool, id, ownerId) {
  const params = [id];
  let ownerCondition = '';
  if (ownerId !== undefined) {
    params.push(ownerId);
    ownerCondition = ` AND owner_id = $2`;
  }
  const res = await pool.query(
    `UPDATE documents 
     SET is_favorite = NOT COALESCE(is_favorite, FALSE), updated_at = NOW() 
     WHERE id = $1${ownerCondition} 
     RETURNING *`,
    params
  );
  return res.rows.length ? mapRow(res.rows[0]) : null;
}

/**
 * moveToTrash – soft deletes a document into Recycle Bin.
 */
export async function moveToTrash(pool, id, ownerId) {
  const params = [id];
  let ownerCondition = '';
  if (ownerId !== undefined) {
    params.push(ownerId);
    ownerCondition = ` AND owner_id = $2`;
  }
  const res = await pool.query(
    `UPDATE documents 
     SET is_deleted = TRUE, deleted_at = NOW(), updated_at = NOW() 
     WHERE id = $1${ownerCondition} 
     RETURNING *`,
    params
  );
  return res.rows.length ? mapRow(res.rows[0]) : null;
}

/**
 * restoreFromTrash – restores a document from Recycle Bin.
 */
export async function restoreFromTrash(pool, id, ownerId) {
  const params = [id];
  let ownerCondition = '';
  if (ownerId !== undefined) {
    params.push(ownerId);
    ownerCondition = ` AND owner_id = $2`;
  }
  const res = await pool.query(
    `UPDATE documents 
     SET is_deleted = FALSE, deleted_at = NULL, updated_at = NOW() 
     WHERE id = $1${ownerCondition} 
     RETURNING *`,
    params
  );
  return res.rows.length ? mapRow(res.rows[0]) : null;
}

/**
 * emptyTrash – permanently deletes all soft-deleted documents for the user.
 */
export async function emptyTrash(pool, ownerId) {
  const params = [];
  let query = 'DELETE FROM documents WHERE is_deleted = TRUE';
  if (ownerId !== undefined) {
    params.push(ownerId);
    query += ' AND owner_id = $1';
  }
  const res = await pool.query(query, params);
  return res.rowCount ?? 0;
}

/**
 * moveToFolder – moves document to a designated folder.
 */
export async function moveToFolder(pool, id, folderName, ownerId) {
  const params = [folderName, id];
  let ownerCondition = '';
  if (ownerId !== undefined) {
    params.push(ownerId);
    ownerCondition = ` AND owner_id = $3`;
  }
  const res = await pool.query(
    `UPDATE documents 
     SET folder_name = $1, updated_at = NOW() 
     WHERE id = $2${ownerCondition} 
     RETURNING *`,
    params
  );
  return res.rows.length ? mapRow(res.rows[0]) : null;
}

/**
 * getFolderStats – returns folders with document counts.
 */
export async function getFolderStats(pool, ownerId) {
  const params = [];
  let ownerCondition = '';
  if (ownerId !== undefined) {
    params.push(ownerId);
    ownerCondition = ` AND owner_id = $1`;
  }
  const res = await pool.query(
    `SELECT COALESCE(folder_name, 'Tài liệu nội bộ') AS name, COUNT(*) AS count
     FROM documents
     WHERE (is_deleted IS NULL OR is_deleted = FALSE)${ownerCondition}
     GROUP BY COALESCE(folder_name, 'Tài liệu nội bộ')
     ORDER BY count DESC`,
    params
  );
  return res.rows;
}

/**
 * getNextExpectedCode – returns the next projected code without incrementing sequence.
 */
export async function getNextExpectedCode(pool) {
  const res = await pool.query(
    `SELECT 'TL-' || LPAD(COALESCE(MAX(SUBSTRING(code FROM 4)::integer), 0) + 1::text, 4, '0') AS next_code 
     FROM documents`
  );
  return res.rows[0]?.next_code || 'TL-0001';
}

/**
 * create – inserts a new document with auto-generated code from sequence.
 */
export async function create(pool, { title, type, description = '', ownerId, originalPath = null, processedPath = null, processMode = null, folderName = 'Tài liệu nội bộ' }) {
  const res = await pool.query(
    `INSERT INTO documents (code, title, type, description, owner_id, original_path, processed_path, process_mode, folder_name)
     VALUES (
       'TL-' || LPAD(nextval('document_code_seq')::text, 4, '0'),
       $1, $2, $3, $4, $5, $6, $7, $8
     )
     RETURNING *`,
    [title, type, description || '', ownerId, originalPath, processedPath, processMode, folderName || 'Tài liệu nội bộ']
  );
  return mapRow(res.rows[0]);
}

/**
 * update – updates mutable fields; returns updated document or null if not found.
 */
export async function update(pool, id, { title, type, description, originalPath, processedPath, processMode, folderName }, ownerId) {
  const setParts = [];
  const params = [];

  if (title !== undefined) {
    params.push(title);
    setParts.push(`title = $${params.length}`);
  }
  if (type !== undefined) {
    params.push(type);
    setParts.push(`type = $${params.length}`);
  }
  if (description !== undefined) {
    params.push(description);
    setParts.push(`description = $${params.length}`);
  }
  if (originalPath !== undefined) {
    params.push(originalPath);
    setParts.push(`original_path = $${params.length}`);
  }
  if (processedPath !== undefined) {
    params.push(processedPath);
    setParts.push(`processed_path = $${params.length}`);
  }
  if (processMode !== undefined) {
    params.push(processMode);
    setParts.push(`process_mode = $${params.length}`);
  }
  if (folderName !== undefined) {
    params.push(folderName);
    setParts.push(`folder_name = $${params.length}`);
  }

  if (setParts.length === 0) {
    return findById(pool, id);
  }

  params.push(id);
  let ownerCondition = '';
  if (ownerId !== undefined) {
    params.push(ownerId);
    ownerCondition = ` AND owner_id = $${params.length}`;
  }
  const res = await pool.query(
    `UPDATE documents SET ${setParts.join(', ')}, updated_at = NOW()
     WHERE id = $${ownerId === undefined ? params.length : params.length - 1}${ownerCondition}
     RETURNING *`,
    params
  );
  return res.rows.length ? mapRow(res.rows[0]) : null;
}

/**
 * remove – permanently deletes document; returns true if deleted, false if not found.
 */
export async function remove(pool, id, ownerId) {
  const params = [id];
  let query = 'DELETE FROM documents WHERE id = $1';
  if (ownerId !== undefined) {
    params.push(ownerId);
    query += ' AND owner_id = $2';
  }
  const res = await pool.query(query, params);
  return (res.rowCount ?? 0) > 0;
}

/**
 * bulkRemove – permanently deletes multiple documents in one query.
 */
export async function bulkRemove(pool, ids, ownerId) {
  if (!Array.isArray(ids) || ids.length === 0) return 0;
  const params = [ids];
  let query = 'DELETE FROM documents WHERE id = ANY($1::int[])';
  if (ownerId !== undefined) {
    params.push(ownerId);
    query += ' AND owner_id = $2';
  }
  const res = await pool.query(query, params);
  return res.rowCount ?? 0;
}

/**
 * copy – duplicates a single document.
 */
export async function copy(pool, id, ownerId) {
  const original = await findById(pool, id);
  if (!original) return null;
  if (ownerId !== undefined && original.owner_id !== ownerId) return null;

  const newTitle = original.title.endsWith('(Bản sao)')
    ? original.title
    : `${original.title} (Bản sao)`.slice(0, 150);

  const newDesc = original.description
    ? `${original.description} [Bản sao từ ${original.code}]`.slice(0, 500)
    : `[Bản sao từ ${original.code}]`;

  const newDoc = await create(pool, {
    title: newTitle,
    type: original.type,
    description: newDesc,
    ownerId: original.owner_id,
    originalPath: original.original_path,
    processedPath: original.processed_path,
    processMode: original.process_mode,
    folderName: original.folder_name,
  });

  return newDoc;
}

/**
 * bulkCopy – duplicates multiple documents in a single transaction.
 */
export async function bulkCopy(pool, ids, ownerId) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const client = await pool.connect();
  const created = [];
  try {
    await client.query('BEGIN');
    for (const id of ids) {
      const origRes = await client.query('SELECT * FROM documents WHERE id = $1', [id]);
      if (!origRes.rows.length) continue;
      const original = origRes.rows[0];
      if (ownerId !== undefined && original.owner_id !== ownerId) continue;

      const newTitle = original.title.endsWith('(Bản sao)')
        ? original.title
        : `${original.title} (Bản sao)`.slice(0, 150);

      const newDesc = original.description
        ? `${original.description} [Bản sao từ ${original.code}]`.slice(0, 500)
        : `[Bản sao từ ${original.code}]`;

      const insRes = await client.query(
        `INSERT INTO documents (code, title, type, description, owner_id, original_path, processed_path, process_mode, folder_name)
         VALUES (
           'TL-' || LPAD(nextval('document_code_seq')::text, 4, '0'),
           $1, $2, $3, $4, $5, $6, $7, $8
         )
         RETURNING *`,
        [newTitle, original.type, newDesc, original.owner_id, original.original_path, original.processed_path, original.process_mode, original.folder_name || 'Tài liệu nội bộ']
      );
      created.push(mapRow(insRes.rows[0]));
    }
    await client.query('COMMIT');
    return created;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * importDocuments – batch inserts valid documents in a transaction.
 */
export async function importDocuments(pool, documents, ownerId) {
  const client = await pool.connect();
  const inserted = [];
  try {
    await client.query('BEGIN');
    for (const item of documents) {
      const insRes = await client.query(
        `INSERT INTO documents (code, title, type, description, owner_id, folder_name)
         VALUES (
           'TL-' || LPAD(nextval('document_code_seq')::text, 4, '0'),
           $1, $2, $3, $4, $5
         )
         RETURNING *`,
        [item.title.trim().slice(0, 150), item.type, (item.description || '').slice(0, 500), ownerId, item.folder_name || 'Tài liệu nội bộ']
      );
      inserted.push(mapRow(insRes.rows[0]));
    }
    await client.query('COMMIT');
    return inserted;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * getDocumentHistory – retrieves audit history for a document.
 */
export async function getDocumentHistory(pool, documentId) {
  const res = await pool.query(
    `SELECT id, actor_username, action, detail, created_at, ip
     FROM audit_logs
     WHERE document_id = $1
     ORDER BY created_at DESC
     LIMIT 5`,
    [documentId]
  );
  return res.rows;
}
