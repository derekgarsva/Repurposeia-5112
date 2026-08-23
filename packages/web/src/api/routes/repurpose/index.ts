import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { generateText } from "ai";
import dedent from "dedent";
import { base } from "../../__core/app";
import { db } from "../../database";
import * as schema from "../../database/schema";
import { gateway, MODEL } from "../../agent/gateway";
import { FORMATS, LANGUAGE_NAMES, LANGUAGES, TONES } from "./formats";
import { excerpt, fetchUrlText } from "./source";

type Output = { key: string; label: string; content: string };

const toneKeys = TONES.map((t) => t.key);
const langKeys = LANGUAGES.map((l) => l.key);

function serializeRun(row: typeof schema.runs.$inferSelect) {
  return { ...row, formats: JSON.parse(row.formats) as Output[] };
}

async function runFormat(args: {
  format: (typeof FORMATS)[number];
  source: string;
  title: string;
  tone: string;
  language: string;
  extra: string;
}): Promise<Output> {
  const toneLabel = TONES.find((t) => t.key === args.tone)?.label ?? args.tone;
  const langName = LANGUAGE_NAMES[args.language] ?? "español";

  const { text } = await generateText({
    model: gateway(MODEL),
    system: dedent`
      Eres un editor de contenido senior que reutiliza material existente en piezas
      listas para publicar. Escribes en ${langName} con tono ${toneLabel}.

      Reglas absolutas:
      - Devuelve SOLO la pieza pedida. Sin preámbulos, sin "aquí tienes", sin comentarios finales.
      - Nada de clichés de IA: "en el mundo de", "sumérgete", "desbloquea", "en la era de", "no es solo X, es Y".
      - Usa datos, cifras y ejemplos concretos que aparezcan en la fuente. Nunca inventes datos.
      - Si la fuente es pobre, sé breve antes que relleno.
    `,
    prompt: dedent`
      FUENTE (título: ${args.title}):
      """
      ${args.source}
      """

      ${args.extra ? `INSTRUCCIÓN ADICIONAL DEL USUARIO: ${args.extra}\n` : ""}
      TAREA — produce esta pieza: ${args.format.label}
      ${args.format.brief}
    `,
  });

  return { key: args.format.key, label: args.format.label, content: text.trim() };
}

export const repurpose = {
  options: base.handler(() => ({
    formats: FORMATS.map(({ key, label, hint }) => ({ key, label, hint })),
    tones: TONES,
    languages: LANGUAGES,
  })),

  history: base.handler(async () => {
    const rows = await db.select().from(schema.runs).orderBy(desc(schema.runs.createdAt)).limit(30);
    return rows.map(serializeRun);
  }),

  get: base.input(z.object({ id: z.number() })).handler(async ({ input }) => {
    const [row] = await db.select().from(schema.runs).where(eq(schema.runs.id, input.id));
    if (!row) throw new ORPCError("NOT_FOUND", { message: "Ese resultado ya no existe." });
    return serializeRun(row);
  }),

  remove: base.input(z.object({ id: z.number() })).handler(async ({ input }) => {
    await db.delete(schema.runs).where(eq(schema.runs.id, input.id));
    return { ok: true };
  }),

  generate: base
    .input(
      z.object({
        kind: z.enum(["text", "url"]),
        value: z.string().min(1),
        tone: z.string().refine((v) => toneKeys.includes(v as never)),
        language: z.string().refine((v) => langKeys.includes(v as never)),
        formats: z.array(z.string()).min(1).max(FORMATS.length),
        extra: z.string().max(500).default(""),
      }),
    )
    .handler(async ({ input }) => {
      const started = Date.now();

      let source = input.value.trim();
      let title = "";
      let sourceUrl = "";

      if (input.kind === "url") {
        if (!/^https?:\/\//i.test(source)) source = `https://${source}`;
        sourceUrl = source;
        const fetched = await fetchUrlText(source);
        title = fetched.title;
        source = fetched.text;
      } else {
        if (source.length < 120) {
          throw new ORPCError("BAD_REQUEST", {
            message: "Necesito al menos ~120 caracteres de texto para trabajar.",
          });
        }
        source = source.slice(0, 24_000);
      }

      const selected = FORMATS.filter((f) => input.formats.includes(f.key));
      if (selected.length === 0) {
        throw new ORPCError("BAD_REQUEST", { message: "Elige al menos un formato." });
      }

      if (!title) {
        const { text } = await generateText({
          model: gateway(MODEL),
          prompt: dedent`
            Dame un título de máximo 8 palabras que describa este contenido.
            Solo el título, sin comillas ni puntuación final.

            """
            ${source.slice(0, 3000)}
            """
          `,
        });
        title = text.trim().replace(/^["'#\s]+|["'.\s]+$/g, "");
      }

      const outputs = await Promise.all(
        selected.map((format) =>
          runFormat({
            format,
            source,
            title,
            tone: input.tone,
            language: input.language,
            extra: input.extra,
          }).catch((error) => ({
            key: format.key,
            label: format.label,
            content: `⚠️ No se pudo generar este formato: ${
              error instanceof Error ? error.message : "error desconocido"
            }`,
          })),
        ),
      );

      const [row] = await db
        .insert(schema.runs)
        .values({
          title: title.slice(0, 160) || "Sin título",
          sourceKind: input.kind,
          sourceValue: sourceUrl,
          sourceExcerpt: excerpt(input.kind === "url" ? source : input.value),
          tone: input.tone,
          language: input.language,
          formats: JSON.stringify(outputs),
          model: MODEL,
          durationMs: Date.now() - started,
        })
        .returning();

      return serializeRun(row!);
    }),
};
