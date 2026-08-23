import { Link2, Loader2, Sparkles, Type } from "lucide-react";
import { cn } from "../lib/utils";

type Option = { key: string; label: string; hint?: string };

type Props = {
  kind: "text" | "url";
  setKind: (k: "text" | "url") => void;
  value: string;
  setValue: (v: string) => void;
  extra: string;
  setExtra: (v: string) => void;
  tone: string;
  setTone: (v: string) => void;
  language: string;
  setLanguage: (v: string) => void;
  formats: string[];
  toggleFormat: (k: string) => void;
  allFormats: Option[];
  tones: Option[];
  languages: Option[];
  onSubmit: () => void;
  pending: boolean;
  error?: string | null;
};

function Pill({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "hairline rounded-sm px-2.5 py-1 font-mono text-[10.5px] tracking-widest uppercase transition",
        active
          ? "border-acid bg-acid text-ink"
          : "text-paper-dim hover:border-white/25 hover:text-paper",
      )}
    >
      {children}
    </button>
  );
}

export function Composer(p: Props) {
  const isUrl = p.kind === "url";

  return (
    <div className="hairline rounded-md bg-ink-raise/60 p-4 backdrop-blur-sm sm:p-5">
      <div className="mb-4 flex gap-1">
        {(
          [
            { k: "text", label: "Texto", Icon: Type },
            { k: "url", label: "URL", Icon: Link2 },
          ] as const
        ).map(({ k, label, Icon }) => (
          <button
            key={k}
            type="button"
            onClick={() => p.setKind(k)}
            className={cn(
              "flex items-center gap-2 rounded-sm px-3 py-1.5 font-mono text-[11px] tracking-widest uppercase transition",
              p.kind === k ? "bg-white/8 text-acid" : "text-paper-dim hover:text-paper",
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>

      {isUrl ? (
        <input
          value={p.value}
          onChange={(e) => p.setValue(e.target.value)}
          placeholder="https://ejemplo.com/mi-articulo"
          className="hairline w-full rounded-sm bg-ink/60 px-3.5 py-3 text-[15px] outline-none placeholder:text-paper-dim/60 focus:border-acid/60"
        />
      ) : (
        <textarea
          value={p.value}
          onChange={(e) => p.setValue(e.target.value)}
          rows={9}
          placeholder="Pega aquí tu artículo, transcripción, notas de una reunión, documentación de producto…"
          className="scroll-thin hairline w-full resize-y rounded-sm bg-ink/60 px-3.5 py-3 text-[15px] leading-relaxed outline-none placeholder:text-paper-dim/60 focus:border-acid/60"
        />
      )}

      <div className="mt-1.5 flex justify-end">
        <span className="label-mono">{p.value.length} car.</span>
      </div>

      <div className="mt-4 space-y-3.5">
        <div>
          <p className="label-mono mb-2">Formatos de salida</p>
          <div className="flex flex-wrap gap-1.5">
            {p.allFormats.map((f) => (
              <Pill
                key={f.key}
                active={p.formats.includes(f.key)}
                onClick={() => p.toggleFormat(f.key)}
              >
                {f.label}
              </Pill>
            ))}
          </div>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2">
          <div>
            <p className="label-mono mb-2">Tono</p>
            <select
              value={p.tone}
              onChange={(e) => p.setTone(e.target.value)}
              className="hairline w-full rounded-sm bg-ink/60 px-2.5 py-2 text-[13.5px] outline-none focus:border-acid/60"
            >
              {p.tones.map((t) => (
                <option key={t.key} value={t.key} className="bg-ink">
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="label-mono mb-2">Idioma de salida</p>
            <select
              value={p.language}
              onChange={(e) => p.setLanguage(e.target.value)}
              className="hairline w-full rounded-sm bg-ink/60 px-2.5 py-2 text-[13.5px] outline-none focus:border-acid/60"
            >
              {p.languages.map((l) => (
                <option key={l.key} value={l.key} className="bg-ink">
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <p className="label-mono mb-2">Instrucción extra (opcional)</p>
          <input
            value={p.extra}
            onChange={(e) => p.setExtra(e.target.value)}
            placeholder="ej. audiencia técnica, menciona nuestro producto, sin emojis"
            className="hairline w-full rounded-sm bg-ink/60 px-3 py-2 text-[13.5px] outline-none placeholder:text-paper-dim/60 focus:border-acid/60"
          />
        </div>
      </div>

      {p.error && (
        <p className="mt-3.5 rounded-sm border border-destructive/40 bg-destructive/10 px-3 py-2 text-[13px] text-destructive">
          {p.error}
        </p>
      )}

      <button
        type="button"
        disabled={p.pending || p.value.trim().length === 0 || p.formats.length === 0}
        onClick={p.onSubmit}
        className="mt-4 flex w-full items-center justify-center gap-2.5 rounded-full bg-acid px-5 py-3 font-medium text-ink transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35"
      >
        {p.pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Generando {p.formats.length} piezas…
          </>
        ) : (
          <>
            <Sparkles className="size-4" />
            Reutilizar contenido
          </>
        )}
      </button>
    </div>
  );
}
