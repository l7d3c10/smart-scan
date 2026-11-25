export function writeAudit(db, {
  userId = null,
  username,
  action,
  documentId = null,
  detail = null,
  ip = null,
}) {
  return db.query(
    `INSERT INTO audit_logs (user_id, actor_username, action, document_id, detail, ip)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [userId, username, action, documentId, detail, ip]
  );
}
