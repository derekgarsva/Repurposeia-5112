import { describe, expect, it } from "bun:test";
import { getOrCreateSession, withSessionHeader } from "./session";

describe("repurpose session", () => {
  it("creates a new session when no cookie is present", () => {
    const result = getOrCreateSession(new Request("http://localhost/api/rpc/repurpose.history"));
    expect(result.isNew).toBe(true);
    expect(result.token).toMatch(/^[a-f0-9-]{36}$/i);
  });

  it("prefers an existing cookie", () => {
    const token = "123e4567-e89b-12d3-a456-426614174000";
    const result = getOrCreateSession(
      new Request("http://localhost/api/rpc/repurpose.history", {
        headers: { cookie: `repurpose_session=${token}` },
      }),
    );
    expect(result).toEqual({ token, isNew: false });
  });

  it("passes the session to the RPC context header", () => {
    const token = "123e4567-e89b-12d3-a456-426614174000";
    const request = withSessionHeader(new Request("http://localhost"), token);
    expect(request.headers.get("x-repurpose-session")).toBe(token);
  });
});
