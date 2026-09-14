import { ORPCError } from "@orpc/server";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const MAX_HTML_BYTES = 1_500_000;
const MAX_REDIRECTS = 3;
const FETCH_TIMEOUT_MS = 15_000;
const BLOCKED_HOSTNAMES = new Set(["localhost", "localhost.localdomain", "metadata.google.internal"]);

/** Descarga una URL pública y extrae texto legible de su HTML. */
export async function fetchUrlText(inputUrl: string): Promise<{ title: string; text: string }> {
  let currentUrl = validateUrl(inputUrl);

  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect++) {
    await assertPublicHost(currentUrl.hostname);

    let res: Response;
    try {
      res = await fetch(currentUrl, {
        redirect: "manual",
        headers: {
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
          accept: "text/html,application/xhtml+xml",
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
    } catch {
      throw new ORPCError("BAD_REQUEST", { message: "No pude acceder a esa URL." });
    }

    if (res.status >= 300 && res.status < 400) {
      if (redirect === MAX_REDIRECTS) {
        throw new ORPCError("BAD_REQUEST", { message: "La URL hizo demasiadas redirecciones." });
      }
      const location = res.headers.get("location");
      if (!location) throw new ORPCError("BAD_REQUEST", { message: "La URL devolvió una redirección inválida." });
      currentUrl = validateUrl(new URL(location, currentUrl).toString());
      continue;
    }

    if (!res.ok) {
      throw new ORPCError("BAD_REQUEST", {
        message: `La URL respondió ${res.status}. Prueba pegando el texto directamente.`,
      });
    }

    const contentType = res.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
      throw new ORPCError("BAD_REQUEST", { message: "La URL no contiene una página HTML legible." });
    }

    const contentLength = Number(res.headers.get("content-length") ?? 0);
    if (Number.isFinite(contentLength) && contentLength > MAX_HTML_BYTES) {
      throw new ORPCError("BAD_REQUEST", { message: "La página es demasiado grande para procesarla." });
    }

    const html = await readBodyWithLimit(res, MAX_HTML_BYTES);
    return extractArticle(html, currentUrl.toString());
  }

  throw new ORPCError("BAD_REQUEST", { message: "No pude resolver esa URL." });
}

function validateUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new ORPCError("BAD_REQUEST", { message: "La URL no es válida." });
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ORPCError("BAD_REQUEST", { message: "Solo acepto URLs http(s)." });
  }
  if (url.username || url.password) {
    throw new ORPCError("BAD_REQUEST", { message: "No acepto URLs con credenciales embebidas." });
  }
  if (BLOCKED_HOSTNAMES.has(url.hostname.toLowerCase())) {
    throw new ORPCError("BAD_REQUEST", { message: "Esa URL no está permitida." });
  }
  return url;
}

async function assertPublicHost(hostname: string) {
  const lower = hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(lower)) {
    throw new ORPCError("BAD_REQUEST", { message: "Esa URL no está permitida." });
  }

  if (isIP(lower)) {
    if (isPrivateOrLocalIp(lower)) {
      throw new ORPCError("BAD_REQUEST", { message: "Esa dirección no está permitida." });
    }
    return;
  }

  let addresses: Array<{ address: string }>;
  try {
    addresses = await lookup(lower, { all: true, verbatim: true });
  } catch {
    throw new ORPCError("BAD_REQUEST", { message: "No pude resolver el dominio de esa URL." });
  }

  if (!addresses.length || addresses.some(({ address }) => isPrivateOrLocalIp(address))) {
    throw new ORPCError("BAD_REQUEST", { message: "Esa URL apunta a una red privada o local." });
  }
}

function isPrivateOrLocalIp(address: string) {
  const version = isIP(address);
  if (version === 4) {
    const [a, b] = address.split(".").map(Number);
    return (
      a === 10 ||
      a === 127 ||
      a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a >= 224 && a <= 255)
    );
  }

  if (version === 6) {
    const normalized = address.toLowerCase();
    return (
      normalized === "::" ||
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe8") ||
      normalized.startsWith("fe9") ||
      normalized.startsWith("fea") ||
      normalized.startsWith("feb") ||
      normalized.startsWith("ff")
    );
  }

  return true;
}

async function readBodyWithLimit(response: Response, maxBytes: number) {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let result = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        throw new ORPCError("BAD_REQUEST", { message: "La página es demasiado grande para procesarla." });
      }
      result += decoder.decode(value, { stream: true });
    }
    result += decoder.decode();
    return result;
  } finally {
    reader.releaseLock();
  }
}

function extractArticle(html: string, sourceUrl: string): { title: string; text: string } {
  const title =
    html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1] ??
    html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ??
    sourceUrl;

  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<(nav|footer|header|aside|form)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6]|br)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (body.length < 200) {
    throw new ORPCError("BAD_REQUEST", {
      message: "Esa página no tiene texto suficiente (¿requiere JS o login?). Pega el texto.",
    });
  }

  return { title: decodeHtml(title).trim(), text: body.slice(0, 24_000) };
}

function decodeHtml(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

export function excerpt(text: string, len = 400) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > len ? `${clean.slice(0, len)}…` : clean;
}
