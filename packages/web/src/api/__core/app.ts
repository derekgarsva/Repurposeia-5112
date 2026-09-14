import { Hono } from "hono";
import { cors } from "hono/cors";
import { os, type Router } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { appendSessionCookie, getOrCreateSession, withSessionHeader } from "./session";

/**
 * TEMPLATE-MANAGED (__ prefix) — do not edit. Feature procedures belong in
 * src/api/routes/, composed in src/api/index.ts.
 *
 * oRPC is the API layer: define procedures on the `router` in src/api/index.ts;
 * they are served at /api/rpc/* and called through the typed clients.
 */

export interface RpcContext {
  /** Raw request headers — read auth/session information here. */
  headers: Headers;
}

export const base = os.$context<RpcContext>();

function allowedOrigins() {
  return new Set(
    [
      process.env.APP_ORIGIN,
      process.env.CORS_ORIGINS,
      "http://localhost:3000",
      "http://localhost:5173",
    ]
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
    if (session.isNew) result = appendSessionCookie(result, session.token);
    return result;
  });

  return app;
}
