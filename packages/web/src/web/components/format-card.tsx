import { useEffect, useState } from "react";
import { Check, Copy, Download, Pencil, RefreshCw, Save, X } from "lucide-react";

type Props = {
  runId: number;
  formatKey: string;
  label: string;
  content: string;
  index: number;
  onSave: (format: string, content: string) => Promise<void>;
  onRegenerate: (format: string) => Promise<void>;
};

export function FormatCard({ runId: _runId, formatKey, label, content, index, onSave, onRegenerate }: Props) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(content);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => setDraft(content), [content]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(editing ? draft : content);
    } catch {
      const el = document.createElement("textarea");
      el.value = editing ? draft : content;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      el.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const download = () => {
    const value = editing ? draft : content;
    const blob = new Blob([value], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${label.toLowerCase().replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const save = async () => {
    setSaving(true);
    try {
      await onSave(formatKey, draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const regenerate = async () => {
    setRegenerating(true);
    try {
      await onRegenerate(formatKey);
      setEditing(false);
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <article className="rise hairline group relative rounded-md bg-ink-raise/70 backdrop-blur-sm" style={{ animationDelay: `${index * 70}ms` }}>
      <header className="flex items-center justify-between gap-3 border-b border-ink-line px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="size-1.5 rounded-full bg-acid" />
          <h3 className="label-mono !text-paper">{label}</h3>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={download} title="Descargar .txt" className="rounded-sm p-1.5 text-paper-dim transition hover:bg-white/5 hover:text-paper">
            <Download className="size-3.5" />
          </button>
          <button onClick={() => setEditing((value) => !value)} title={editing ? "Cerrar edición" : "Editar"} className="rounded-sm p-1.5 text-paper-dim transition hover:bg-white/5 hover:text-acid">
            {editing ? <X className="size-3.5" /> : <Pencil className="size-3.5" />}
          </button>
          <button onClick={regenerate} disabled={regenerating} title="Regenerar" className="rounded-sm p-1.5 text-paper-dim transition hover:bg-white/5 hover:text-acid disabled:opacity-40">
            <RefreshCw className={`size-3.5 ${regenerating ? "animate-spin" : ""}`} />
          </button>
          <button onClick={copy} className="flex items-center gap-1.5 rounded-sm px-2 py-1.5 font-mono text-[10.5px] tracking-widest uppercase text-paper-dim transition hover:bg-white/5 hover:text-acid">
            {copied ? <Check className="size-3.5 text-acid" /> : <Copy className="size-3.5" />}
            {copied ? "copiado" : "copiar"}
          </button>
        </div>
      </header>

      <div className="scroll-thin max-h-[26rem] overflow-y-auto px-4 py-3.5">
        {editing ? (
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="min-h-80 w-full resize-y rounded border border-ink-line bg-ink-deep/60 p-3 font-sans text-[14.5px] leading-[1.7] text-paper outline-none transition focus:border-acid/50"
            maxLength={12_000}
            autoFocus
          />
        ) : (
          <pre className="font-sans text-[14.5px] leading-[1.7] whitespace-pre-wrap text-paper/90">{content}</pre>
        )}
      </div>

      {editing && (
        <footer className="flex items-center justify-between gap-3 border-t border-ink-line px-4 py-2.5">
          <span className="label-mono">{draft.length}/12000</span>
          <div className="flex gap-2">
            <button onClick={() => { setDraft(content); setEditing(false); }} className="rounded-sm px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-paper-dim hover:bg-white/5">Cancelar</button>
            <button onClick={save} disabled={saving || !draft.trim()} className="flex items-center gap-1.5 rounded-sm bg-acid px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-ink disabled:opacity-40">
              <Save className="size-3.5" />{saving ? "guardando" : "guardar"}
            </button>
          </div>
        </footer>
      )}

      {!editing && (
        <footer className="flex items-center justify-between border-t border-ink-line px-4 py-2">
          <span className="label-mono">{content.length} caracteres</span>
          <span className="label-mono">{content.trim().split(/\s+/).filter(Boolean).length} palabras</span>
        </footer>
      )}
    </article>
  );
}
