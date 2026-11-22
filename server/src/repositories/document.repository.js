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
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * findAll – paginated list with optional search/type/sort filters.
 * @returns {{ rows: object[], total: number }}
 */
export async function findAll(pool, { search, type, page = 1, limit = 20, sort = 'created_at_desc', ownerId } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const params = [];
  const conditions = [];

  if (search && search.trim()) {
    params.push(`%${search.trim()}%`);
    conditions.push(`title ILIKE $${params.length}`);
  }

  if (type && VALID_TYPES.includes(type)) {
    params.push(type);
    conditions.push(`type = $${params.length}`);
  }

  if (ownerId !== undefined) {
    params.push(ownerId);
    conditions.push(`owner_id = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const orderBy = sort === 'title_asc' ? 'title ASC' : 'created_at DESC';

  // Count query
  const countRes = await pool.query(
    `SELECT COUNT(*) AS total FROM documents ${where}`,
    params
  );
  const total = Number(countRes.rows[0].total);

  // Data query
  const dataParams = [...params, safeLimit, offset];
  const dataRes = await pool.query(
    `SELECT * FROM documents ${where} ORDER BY ${orderBy} LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
    dataParams
  );

  return { rows: dataRes.rows.map(mapRow), total };
}

export async function findForExport(pool, { search, type, sort = 'created_at_desc', ownerId } = {}) {
  const params = [];
  const conditions = [];
  if (search?.trim()) {
    params.push(`%${search.trim()}%`);
    conditions.push(`title ILIKE $${params.length}`);
  }
  if (type) {
    params.push(type);
    conditions.push(`type = $${params.length}`);
  }
  if (ownerId !== undefined) {
    params.push(ownerId);
    conditions.push(`owner_id = $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const orderBy = sort === 'title_asc' ? 'title ASC' : 'created_at DESC';
  params.push(50001);
  const result = await pool.query(
    `SELECT * FROM documents ${where} ORDER BY ${orderBy} LIMIT $${params.length}`,
    params
  );
  return result.rows.map(mapRow);
}

/**
 * findById – returns single document or null.
 */
export async function findById(pool, id) {
  const res = await pool.query('SELECT * FROM documents WHERE id = $1', [id]);
  return res.rows.length ? mapRow(res.rows[0]) : null;
}

/**
 * create – inserts a new document with auto-generated code.
 */
export async function create(pool, { title, type, description = '', ownerId }) {
  const res = await pool.query(
    `INSERT INTO documents (code, title, type, description, owner_id)
     VALUES (
       'TL-' || LPAD(nextval('document_code_seq')::text, 4, '0'),
       $1, $2, $3, $4
     )
     RETURNING *`,
    [title, type, description || '', ownerId]
  );
  return mapRow(res.rows[0]);
}

/**
 * update – updates mutable fields; returns updated document or null if not found.
 */
export async function update(pool, id, { title, type, description }, ownerId) {
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
 * remove – deletes document; returns true if deleted, false if not found.
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
