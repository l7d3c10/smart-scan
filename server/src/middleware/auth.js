export async function requireAuth(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({
      ok: false,
      error: { code: 'UNAUTHENTICATED', message: 'Bạn cần đăng nhập để tiếp tục.' },
    });
  }

  try {
    const result = await req.app.locals.pool.query(
      'SELECT id, username, role, locked FROM users WHERE id = $1',
      [req.session.userId]
    );
    const user = result.rows[0];
    if (!user || user.locked) {
      req.session.destroy(() => {});
      return res.status(401).json({
        ok: false,
        error: { code: 'UNAUTHENTICATED', message: 'Phiên đăng nhập không còn hợp lệ.' },
      });
    }
    req.user = { id: user.id, username: user.username, role: user.role };
    return next();
  } catch (error) {
    return next(error);
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      ok: false,
      error: { code: 'FORBIDDEN', message: 'Bạn không có quyền thực hiện thao tác này.' },
    });
  }
  return next();
}

// User luôn nhận cùng phản hồi cho ID không tồn tại và tài liệu của người khác.
export async function requireDocumentAccess(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    if (req.user.role === 'admin') return next();
    return res.status(403).json({
      ok: false,
      error: { code: 'FORBIDDEN', message: 'Bạn không có quyền truy cập tài liệu này.' },
    });
  }

  try {
    const result = await req.app.locals.pool.query(
      'SELECT owner_id FROM documents WHERE id = $1',
      [id]
    );
    const document = result.rows[0];
    if (req.user.role !== 'admin' && (!document || document.owner_id !== req.user.id)) {
      return res.status(403).json({
        ok: false,
        error: { code: 'FORBIDDEN', message: 'Bạn không có quyền truy cập tài liệu này.' },
      });
    }
    return next();
  } catch (error) {
    return next(error);
  }
}
