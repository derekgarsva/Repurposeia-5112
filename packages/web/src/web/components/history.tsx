import { Trash2 } from "lucide-react";
import { cn } from "../lib/utils";

type Item = {
  id: number;
  title: string;
  sourceKind: string;
  createdAt: Date | string;
  formats: { key: string }[];
};

type Props = {
  items: Item[];
  activeId: number | null;
  onOpen: (id: number) => void;
  onRemove: (id: number) => void;
};

export function History({ items, activeId, onOpen, onRemove }: Props) {
  if (items.length === 0) return null;

  return (
    <section className="rise" style={{ animationDelay: "220ms" }}>
      <p className="label-mono mb-2.5">Historial · {items.length}</p>
      <div className="scroll-thin flex gap-2 overflow-x-auto pb-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onOpen(item.id)}
            className={cn(
              "group hairline relative min-w-[13.5rem] shrink-0 rounded-sm bg-ink-raise/50 px-3 py-2.5 text-left transition hover:border-white/25",
              activeId === item.id && "border-acid/70 bg-acid/8",
            )}
          >
            <span
              className={cn(
                "absolute inset-y-2 left-0 w-[2px] rounded-full",
                activeId === item.id ? "bg-acid" : "bg-white/15",
              )}
            />
            <p className="truncate pr-5 text-[13.5px] leading-snug text-paper/90">{item.title}</p>
            <p className="label-mono mt-1">
              {item.sourceKind === "url" ? "URL" : "TEXTO"} · {item.formats.length} piezas ·{" "}
              {new Date(item.createdAt).toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "short",
              })}
            </p>
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                onRemove(item.id);
              }}
              className="absolute top-2 right-2 rounded-sm p-1 text-paper-dim opacity-0 transition group-hover:opacity-100 hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
