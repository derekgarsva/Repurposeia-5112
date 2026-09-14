const SESSION_COOKIE = "repurpose_session";
const SESSION_HEADER = "x-repurpose-session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export function getOrCreateSession(request: Request): { token: string; isNew: boolean } {
  const fromHeader = request.headers.get(SESSION_HEADER)?.trim();
  if (isSafeToken(fromHeader)) return { token: fromHeader, isNew: false };

  const fromCookie = readCookie(request.headers.get("cookie"), SESSION_COOKIE);
  if (isSafeToken(fromCookie)) return { token: fromCookie, isNew: false };

  return { token: crypto.randomUUID(), isNew: true };
}

export function withSessionHeader(request: Request, token: string): Request {
  const headers = new Headers(request.headers);
  headers.set(SESSION_HEADER, token);
  return new Request(request, { headers });
}

export function appendSessionCookie(response: Response, token: string): Response {
  const headers = new Headers(response.headers);
  headers.append(
    "set-cookie",
    `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}${
      process.env.NODE_ENV === "production" ? "; Secure" : ""
    }`,
  );
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function readCookie(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return value.join("=");
  }
  return undefined;
}

function isSafeToken(value: string | undefined): value is string {
  return !!value && /^[a-f0-9-]{36}$/i.test(value);
}
