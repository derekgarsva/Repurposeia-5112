import { and, eq } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { db, ensureRepurposeSchema } from "../database";
import * as schema from "../database/schema";
import { getOrCreateSession } from "../__core/session";

const FREE_RUN_LIMIT = 3;
const STRIPE_API = "https://api.stripe.com/v1";

function env(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new ORPCError("PRECONDITION_FAILED", { message: `Falta configurar ${name}.` });
  return value;
}

function activePro(plan?: string | null, status?: string | null) {
  return plan === "pro" && (status === "active" || status === "trialing");
}

export async function getBillingStatus(request: Request) {
  await ensureRepurposeSchema();
  const { token } = getOrCreateSession(request);
  const [entitlement] = await db.select().from(schema.entitlements).where(eq(schema.entitlements.ownerToken, token));
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const runs = await db
    .select({ id: schema.runs.id })
    .from(schema.runs)
    .where(and(eq(schema.runs.ownerToken, token), schema.runs.createdAt >= since));

  return {
    plan: activePro(entitlement?.plan, entitlement?.status) ? "pro" : "free",
    status: entitlement?.status ?? "free",
    used: runs.length,
    limit: FREE_RUN_LIMIT,
    remaining: activePro(entitlement?.plan, entitlement?.status) ? null : Math.max(0, FREE_RUN_LIMIT - runs.length),
  };
}

export async function createCheckout(request: Request) {
  const { token } = getOrCreateSession(request);
  await ensureRepurposeSchema();
  const [entitlement] = await db.select().from(schema.entitlements).where(eq(schema.entitlements.ownerToken, token));
  if (activePro(entitlement?.plan, entitlement?.status)) return { url: new URL("/", request.url).toString() };

  const stripeKey = env("STRIPE_SECRET_KEY");
  const priceId = env("STRIPE_PRICE_PRO_MONTHLY");
  const origin = process.env.APP_ORIGIN?.trim() || new URL(request.url).origin;

  const form = new URLSearchParams();
  form.set("mode", "subscription");
  form.set("line_items[0][price]", priceId);
  form.set("line_items[0][quantity]", "1");
  form.set("success_url", `${origin}/?billing=success`);
  form.set("cancel_url", `${origin}/?billing=cancelled`);
  form.set("allow_promotion_codes", "true");
  form.set("metadata[owner_token]", token);
  form.set("client_reference_id", token);
  form.set("subscription_data[metadata][owner_token]", token);

  let response: Response;
  try {
    response = await fetch(`${STRIPE_API}/checkout/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form,
    });
  } catch {
    throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "No pude iniciar el pago. Inténtalo de nuevo." });
  }

  const payload = (await response.json().catch(() => null)) as { url?: string; error?: { message?: string } } | null;
  if (!response.ok || !payload?.url) {
    throw new ORPCError("BAD_REQUEST", { message: payload?.error?.message?.slice(0, 180) || "Stripe rechazó el checkout." });
  }
  return { url: payload.url };
}

export async function handleStripeWebhook(request: Request) {
  await ensureRepurposeSchema();
  const secret = env("STRIPE_WEBHOOK_SECRET");
  const signature = request.headers.get("stripe-signature");
  if (!signature) throw new ORPCError("BAD_REQUEST", { message: "Firma de Stripe ausente." });

  const body = await request.text();
  if (!(await verifyStripeSignature(body, signature, secret))) {
    throw new ORPCError("UNAUTHORIZED", { message: "Firma de Stripe inválida." });
  }

  const event = JSON.parse(body) as {
    type: string;
    data?: { object?: Record<string, unknown> };
  };
  const object = event.data?.object ?? {};
  const metadata = (object.metadata ?? {}) as Record<string, string>;
  const ownerToken = metadata.owner_token || (typeof object.client_reference_id === "string" ? object.client_reference_id : "");

  if (event.type === "checkout.session.completed" && ownerToken) {
    const subscriptionId = typeof object.subscription === "string" ? object.subscription : null;
    const customerId = typeof object.customer === "string" ? object.customer : null;
    await db
      .insert(schema.entitlements)
      .values({ ownerToken, plan: "pro", status: "active", stripeCustomerId: customerId, stripeSubscriptionId: subscriptionId })
      .onConflictDoUpdate({ target: schema.entitlements.ownerToken, set: { plan: "pro", status: "active", stripeCustomerId: customerId, stripeSubscriptionId: subscriptionId } });
  }

  if ((event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") && ownerToken) {
    const status = event.type === "customer.subscription.deleted" ? "canceled" : String(object.status ?? "unknown");
    await db
      .insert(schema.entitlements)
      .values({ ownerToken, plan: "pro", status, stripeCustomerId: typeof object.customer === "string" ? object.customer : null, stripeSubscriptionId: typeof object.id === "string" ? object.id : null })
      .onConflictDoUpdate({ target: schema.entitlements.ownerToken, set: { plan: activePro("pro", status) ? "pro" : "free", status, stripeCustomerId: typeof object.customer === "string" ? object.customer : null, stripeSubscriptionId: typeof object.id === "string" ? object.id : null } });
  }

  return { received: true };
}

async function verifyStripeSignature(payload: string, header: string, secret: string) {
  const parts = header.split(",");
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));
  if (!timestamp || signatures.length === 0) return false;
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", key, encoder.encode(`${timestamp}.${payload}`));
  const expected = [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
  return signatures.some((candidate) => candidate.length === expected.length && timingSafeEqual(candidate, expected));
}

function timingSafeEqual(left: string, right: string) {
  let diff = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index++) diff |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  return diff === 0;
}

export function freeRunLimit() {
  return FREE_RUN_LIMIT;
}
