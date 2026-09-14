import { Hono } from "hono";
import { cors } from "hono/cors";
import { os, type Router } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { appendSessionCookie, getOrCreateSession, withSessionHeader } from "./session";
import { createCheckout, getBillingStatus, handleStripeWebhook } from "../routes/billing";

export interface RpcContext {
  headers: Headers;
}

export const base = os.$context<RpcContext>();

function allowedOrigins() {
  return new Set(
    [process.env.APP_ORIGIN, process.env.CORS_ORIGINS, "http://localhost:3000", "http://localhost:5173"]
      .flatMap((value) => (value ? value.split(",") : []))
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

export function createApp(router: Router<Record<never, never>, RpcContext>) {
  const origins = allowedOrigins();
  const app = new Hono().use(
    cors({
      origin: (origin) => (origin && origins.has(origin) ? origin : undefined),
      credentials: true,
    }),
  );

  app.get("/api/health", (c) => c.json({ status: "ok" }, 200));

  app.get("/api/billing/status", async (c) => {
    const session = getOrCreateSession(c.req.raw);
    const result = await getBillingStatus(c.req.raw);
    const response = c.json(result, 200, { "cache-control": "no-store" });
    return session.isNew ? appendSessionCookie(response, session.token) : response;
  });

  app.post("/api/billing/checkout", async (c) => {
    const session = getOrCreateSession(c.req.raw);
    const result = await createCheckout(withSessionHeader(c.req.raw, session.token));
    const response = c.json(result, 200, { "cache-control": "no-store" });
    return session.isNew ? appendSessionCookie(response, session.token) : response;
  });

  app.post("/api/billing/webhook", async (c) => {
    const result = await handleStripeWebhook(c.req.raw);
    return c.json(result, 200);
  });

  const handler = new RPCHandler(router);
  app.use("/api/rpc/*", async (c, next) => {
    const session = getOrCreateSession(c.req.raw);
    const request = withSessionHeader(c.req.raw, session.token);
    const { matched, response } = await handler.handle(request, {
      prefix: "/api/rpc",
      context: { headers: request.headers },
    });

    if (!matched) {
      await next();
      return;
    }

    let result = c.newResponse(response.body, response);
    result.headers.set("cache-control", "no-store");
    if (session.isNew) result = appendSessionCookie(result, session.token);
    return result;
  });

  return app;
}
