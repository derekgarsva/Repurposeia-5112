import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/**
 * Un "run" es una ejecución de la automatización: una fuente (texto o URL)
 * convertida en varios formatos de contenido.
 */
export const runs = sqliteTable("runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  // Anonymous browser/session ownership until account auth is wired in.
  ownerToken: text("owner_token"),
  title: text("title").notNull(),
  sourceKind: text("source_kind").notNull(), // "text" | "url"
  sourceValue: text("source_value").notNull(),
  sourceExcerpt: text("source_excerpt").notNull(),
  tone: text("tone").notNull(),
  language: text("language").notNull(),
  formats: text("formats").notNull(), // JSON: { key, label, content }[]
  model: text("model").notNull(),
  durationMs: integer("duration_ms").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
