import { pool } from "./database.js";
import type { Pass } from "./pass.js";

export async function getPassById(
  id: string
): Promise<Pass | null> {

  const result = await pool.query(
    `SELECT id, name, document, issued_at, status
     FROM passes
     WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];

  return {
    id: row.id,
    name: row.name,
    document: row.document,
    issuedAt: row.issued_at,
    status: row.status
  };
}
