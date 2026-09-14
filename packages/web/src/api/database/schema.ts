import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const runs = sqliteTable("runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerToken: text("owner_token"),
  title: text("title").notNull(),
  sourceKind: text("source_kind").notNull(),
  sourceValue: text("source_value").notNull(),
  sourceExcerpt: text("source_excerpt").notNull(),
  tone: text("tone").notNull(),
  language: text("language").notNull(),
  formats: text("formats").notNull(),
  model: text("model").notNull(),
  durationMs: integer("duration_ms").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const entitlements = sqliteTable("entitlements", {
  ownerToken: text("owner_token").primaryKey(),
  plan: text("plan").notNull().default("free"),
  status: text("status").notNull().default("free"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
