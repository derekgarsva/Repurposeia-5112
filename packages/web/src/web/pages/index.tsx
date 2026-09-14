import { useEffect, useMemo, useState } from "react";
import { Clock, Cpu, Download, Layers, Zap, Sparkles, Settings } from "lucide-react";
import { Composer } from "../components/composer";
import { FormatCard } from "../components/format-card";
import { History } from "../components/history";
import { useGenerate, useHistory, useOptions, useRemoveRun, useRegenerateFormat, useUpdateFormat } from "../queries/repurpose";

type Output = { key: string; label: string; content: string };
type Run = { id: number; title: string; tone: string; language: string; model: string; durationMs: number; sourceExcerpt: string; formats: Output[] };
type Billing = { plan: "free" | "pro"; status: string; used: number; limit: number; remaining: number | null };
const DEFAULT_FORMATS = ["x_thread", "linkedin", "newsletter", "short_script"];

function Index() {
  const options = useOptions();
  const history = useHistory();
  const generate = useGenerate();
  const removeRun = useRemoveRun();
  const updateFormat = useUpdateFormat();
  const regenerateFormat = useRegenerateFormat();
  const [kind, setKind] = useState<"text" | "url">("text");
  const [value, setValue] = useState("");
  const [extra, setExtra] = useState("");
  const [tone, setTone] = useState("directo");
  const [language, setLanguage] = useState("es");
  const [formats, setFormats] = useState<string[]>(DEFAULT_FORMATS);
  const [active, setActive] = useState<Run | null>(null);
  const [billing, setBilling] = useState<Billing | null>(null);
  const [billingPending, setBillingPending] = useState(false);

  const allFormats = options.data?.formats ?? [];
  const tones = useMemo(() => options.data?.tones?.map((t) => ({ ...t })) ?? [], [options.data]);
  const languages = useMemo(() => options.data?.languages?.map((l) => ({ ...l })) ?? [], [options.data]);
  const items = history.data ?? [];

  const refreshBilling = async () => {
    const response = await fetch("/api/billing/status", { credentials: "include", cache: "no-store" });
    if (response.ok) setBilling((await response.json()) as Billing);
  };
  useEffect(() => { void refreshBilling(); }, []);
  useEffect(() => { if (generate.data) { setActive(generate.data as Run); void refreshBilling(); } }, [generate.data]);
  useEffect(() => { if (!active) return; const fresh = items.find((item) => item.id === active.id); if (fresh) setActive(fresh as Run); }, [items, active?.id]);

  const upgrade = async () => {
    if (billingPending) return;
    setBillingPending(true);
    try {
      const response = await fetch("/api/billing/checkout", { method: "POST", credentials: "include" });
      const payload = (await response.json().catch(() => null)) as { url?: string } | null;
      if (response.ok && payload?.url) window.location.assign(payload.url);
    } finally { setBillingPending(false); }
  };

  const manageBilling = async () => {
    if (billingPending) return;
    setBillingPending(true);
    try {
      const response = await fetch("/api/billing/portal", { method: "POST", credentials: "include" });
      const payload = (await response.json().catch(() => null)) as { url?: string } | null;
      if (response.ok && payload?.url) window.location.assign(payload.url);
    } finally { setBillingPending(false); }
  };

  const saveFormat = async (format: string, content: string) => {
    const run = await updateFormat.mutateAsync({ id: active!.id, format, content });
    setActive(run as Run);
  };
  const regenerate = async (format: string) => {
    const run = await regenerateFormat.mutateAsync({ id: active!.id, format, extra: "" });
    setActive(run as Run);
  };
  const downloadAll = () => {
    if (!active) return;
    const body = active.formats.map((format) => `# ${format.label}\n\n${format.content}`).join("\n\n---\n\n");
    const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "repurpose-export.txt"; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-[1400px] px-5 pt-10 pb-24 sm:px-8 lg:px-12">
      <header className="rise flex flex-wrap items-end justify-between gap-6 border-b border-ink-line pb-8">
        <div>
          <div className="mb-3 flex items-center gap-2.5"><span className="size-2 rounded-full bg-acid pulse-dot" /><span className="label-mono">Automatización de contenido · IA</span></div>
          <h1 className="font-display max-w-2xl text-[clamp(2.6rem,6vw,4.6rem)]">Un contenido.<br /><span className="text-acid italic">Seis piezas</span> listas para publicar.</h1>
        </div>
        <div className="flex max-w-xs flex-col items-end gap-3">
          <p className="text-right text-[14.5px] text-paper-dim">Pega un artículo, una transcripción o una URL. La IA lee, entiende y reescribe todo en paralelo.</p>
          {billing && <div className="flex flex-wrap items-center justify-end gap-2"><span className="label-mono rounded-sm border border-ink-line px-2 py-1">{billing.plan === "pro" ? "PRO · activo" : `${billing.remaining}/${billing.limit} gratis`}</span>{billing.plan === "pro" ? <button onClick={manageBilling} disabled={billingPending} className="flex items-center gap-1.5 rounded-sm border border-ink-line px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-widest text-paper-dim hover:border-acid/40 hover:text-acid disabled:opacity-60"><Settings className="size-3" /> gestionar</button> : <button onClick={upgrade} disabled={billingPending} className="flex items-center gap-1.5 rounded-sm bg-acid px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink hover:brightness-110 disabled:opacity-60"><Sparkles className="size-3" /> Pro $12/mes</button>}</div>}
        </div>
      </header>

      {billing?.remaining === 0 && billing.plan !== "pro" && <div className="rise mt-5 flex flex-wrap items-center justify-between gap-4 rounded-md border border-acid/30 bg-acid/5 px-4 py-3"><div><p className="font-medium text-paper">Has probado Repurpose.</p><p className="text-[13.5px] text-paper-dim">Desbloquea generaciones ilimitadas y sigue publicando sin fricción.</p></div><button onClick={upgrade} disabled={billingPending} className="flex items-center gap-2 rounded-sm bg-acid px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-ink"><Sparkles className="size-3.5" /> Pasar a Pro</button></div>}

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] lg:gap-10">
        <div className="rise space-y-6" style={{ animationDelay: "90ms" }}>
          <Composer kind={kind} setKind={setKind} value={value} setValue={setValue} extra={extra} setExtra={setExtra} tone={tone} setTone={setTone} language={language} setLanguage={setLanguage} formats={formats} toggleFormat={(k) => setFormats((prev) => prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k])} allFormats={allFormats} tones={tones} languages={languages} onSubmit={() => generate.mutate({ kind, value: value.trim(), tone, language, formats, extra: extra.trim() })} pending={generate.isPending} error={generate.error ? (generate.error.message ?? "Algo falló.") : null} />
          <History items={items} activeId={active?.id ?? null} onOpen={(id) => { const found = items.find((item) => item.id === id); if (found) setActive(found as Run); }} onRemove={(id) => { removeRun.mutate({ id }); if (active?.id === id) setActive(null); }} />
        </div>
        <div className="rise space-y-4" style={{ animationDelay: "160ms" }}>
          {active ? <><div className="hairline flex flex-wrap items-center justify-between gap-3 rounded-md bg-ink-raise/40 px-4 py-3"><div className="min-w-0"><p className="label-mono">Resultado</p><h2 className="font-display truncate text-2xl">{active.title}</h2></div><div className="flex shrink-0 flex-wrap items-center gap-2"><span className="label-mono flex items-center gap-1.5 px-2"><Layers className="size-3.5" /> {active.formats.length}</span><span className="label-mono flex items-center gap-1.5 px-2"><Clock className="size-3.5" /> {(active.durationMs / 1000).toFixed(1)}s</span><span className="label-mono flex items-center gap-1.5 px-2"><Cpu className="size-3.5" /> {active.model.split("/")[1] ?? active.model}</span><button onClick={downloadAll} className="flex items-center gap-1.5 rounded-sm border border-ink-line px-2 py-1.5 font-mono text-[10px] uppercase tracking-widest text-paper-dim hover:border-acid/40 hover:text-acid"><Download className="size-3.5" /> todo</button></div></div><div className="grid gap-4 xl:grid-cols-2">{active.formats.map((f, i) => <FormatCard key={f.key} runId={active.id} formatKey={f.key} label={f.label} content={f.content} index={i} onSave={saveFormat} onRegenerate={regenerate} />)}</div></> : generate.isPending ? <div className="grid gap-4 xl:grid-cols-2">{formats.map((k, i) => <div key={k} className="hairline rise h-52 animate-pulse rounded-md bg-ink-raise/40" style={{ animationDelay: `${i * 70}ms` }} />)}</div> : <div className="hairline flex min-h-[26rem] flex-col justify-center rounded-md bg-ink-raise/25 p-8"><Zap className="mb-5 size-6 text-acid" /><h2 className="font-display mb-3 text-3xl">Aquí aparecerán tus <span className="text-acid italic">piezas</span></h2><p className="mb-6 max-w-md text-[14.5px] text-paper-dim">Cada formato se genera con su propio brief editorial: estructura, longitud y ritmo distintos. Todos se ejecutan en paralelo.</p><ul className="space-y-2">{allFormats.map((f) => <li key={f.key} className="flex items-baseline gap-3 border-t border-ink-line pt-2"><span className="text-[14.5px] text-paper/85">{f.label}</span><span className="label-mono">{f.hint}</span></li>)}</ul></div>}
        </div>
      </div>
    </div>
  );
}

export default Index;
