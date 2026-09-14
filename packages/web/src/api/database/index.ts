import { sql } from "drizzle-orm";
import { db } from "./__client";

let ownerColumnReady: Promise<void> | undefined;

/**
 * Small forward-compatible bootstrap for deployments that still have the
 * original runs table. Normal Drizzle migrations can keep owning schema
 * changes; this prevents an existing production DB from going down after the
 * session-ownership hardening deploy.
 */
export function ensureRepurposeSchema() {
  ownerColumnReady ??= db
    .run(sql`ALTER TABLE runs ADD COLUMN owner_token TEXT`)
    .then(() => undefined)
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      if (!/duplicate column|already exists/i.test(message)) throw error;
    });
  return ownerColumnReady;
}

export { db };
