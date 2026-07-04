import { useEffect, useState } from "react";
import { Columns2, Eye, Pencil } from "lucide-react";
import { renderMarkdown } from "@/lib/markdown";

type Mode = "edit" | "split" | "preview";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minHeight?: number;
  storageKey?: string;
  disabled?: boolean;
  id?: string;
}

const KEY = "devflow.mdmode";

export default function MarkdownEditor({
  value,
  onChange,
  placeholder,
  minHeight = 200,
  storageKey,
  disabled,
  id,
}: Props) {
  const [mode, setMode] = useState<Mode>("edit");

  useEffect(() => {
    try {
      const stored = (localStorage.getItem(storageKey || KEY) as Mode | null) || "edit";
      if (stored === "edit" || stored === "split" || stored === "preview") setMode(stored);
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  const change = (m: Mode) => {
    setMode(m);
    try {
      localStorage.setItem(storageKey || KEY, m);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center gap-1 rounded-lg bg-muted p-1 w-fit">
        {(
          [
            { key: "edit" as Mode, icon: Pencil, label: "Éditer" },
            { key: "split" as Mode, icon: Columns2, label: "Split" },
            { key: "preview" as Mode, icon: Eye, label: "Aperçu" },
          ]
        ).map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => change(key)}
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
              mode === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-3 w-3" />
            {label}
          </button>
        ))}
      </div>

      <div
        className={`grid gap-3 ${mode === "split" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}
        style={{ minHeight }}
      >
        {(mode === "edit" || mode === "split") && (
          <textarea
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full rounded-md border border-border bg-muted p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-y font-mono transition-colors disabled:opacity-50"
            style={{ minHeight }}
          />
        )}
        {(mode === "preview" || mode === "split") && (
          <div
            className="rounded-md border border-border bg-card p-3 text-sm text-foreground/90 overflow-auto"
            style={{ minHeight }}
          >
            {value.trim() ? (
              renderMarkdown(value)
            ) : (
              <span className="text-muted-foreground italic text-xs">Aperçu vide</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
