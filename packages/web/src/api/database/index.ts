import { sql } from "drizzle-orm";
import { db } from "./__client";

let schemaReady: Promise<void> | undefined;

export function ensureRepurposeSchema() {
  schemaReady ??= (async () => {
    await db.run(sql`ALTER TABLE runs ADD COLUMN owner_token TEXT`).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      if (!/duplicate column|already exists/i.test(message)) throw error;
    });

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS entitlements (
        owner_token TEXT PRIMARY KEY NOT NULL,
        plan TEXT NOT NULL DEFAULT 'free',
        status TEXT NOT NULL DEFAULT 'free',
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT,
        updated_at INTEGER NOT NULL
      )
    `);

    await db.run(sql`
      CREATE INDEX IF NOT EXISTS runs_owner_created_idx
      ON runs(owner_token, created_at DESC)
    `);
  })();
  return schemaReady;
}

export { db };
