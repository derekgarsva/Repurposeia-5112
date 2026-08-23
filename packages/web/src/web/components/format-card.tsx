import { useState } from "react";
import { Check, Copy, Download } from "lucide-react";

type Props = {
  label: string;
  content: string;
  index: number;
};

export function FormatCard({ label, content, index }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      const el = document.createElement("textarea");
      el.value = content;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      el.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const download = () => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${label.toLowerCase().replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <article
      className="rise hairline group relative rounded-md bg-ink-raise/70 backdrop-blur-sm"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <header className="flex items-center justify-between gap-3 border-b border-ink-line px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="size-1.5 rounded-full bg-acid" />
          <h3 className="label-mono !text-paper">{label}</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={download}
            title="Descargar .txt"
            className="rounded-sm p-1.5 text-paper-dim transition hover:bg-white/5 hover:text-paper"
          >
            <Download className="size-3.5" />
          </button>
          <button
            onClick={copy}
            className="flex items-center gap-1.5 rounded-sm px-2 py-1.5 font-mono text-[10.5px] tracking-widest uppercase text-paper-dim transition hover:bg-white/5 hover:text-acid"
          >
            {copied ? <Check className="size-3.5 text-acid" /> : <Copy className="size-3.5" />}
            {copied ? "copiado" : "copiar"}
          </button>
        </div>
      </header>

      <div className="scroll-thin max-h-[26rem] overflow-y-auto px-4 py-3.5">
        <pre className="font-sans text-[14.5px] leading-[1.7] whitespace-pre-wrap text-paper/90">
          {content}
        </pre>
      </div>

      <footer className="flex items-center justify-between border-t border-ink-line px-4 py-2">
        <span className="label-mono">{content.length} caracteres</span>
        <span className="label-mono">
          {content.trim().split(/\s+/).filter(Boolean).length} palabras
        </span>
      </footer>
    </article>
  );
}
