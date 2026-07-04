import CopyButton from "@/components/CopyButton";

/**
 * Rendu léger d'un contenu Markdown avec support :
 * - blocs de code ```lang
 * - code inline `xxx`
 * - gras **xxx**
 * - listes, titres, liens basiques
 */
export function renderMarkdown(text: string) {
  const parts = text.split(/(```[\s\S]*?```|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("```")) {
      const langMatch = part.match(/```(\w+)/);
      const lang = langMatch ? langMatch[1] : "";
      const code = part.replace(/```\w*\n?/, "").replace(/```$/, "");
      return (
        <div key={i} className="relative group my-3">
          {lang && (
            <span className="absolute top-0 left-0 rounded-tl-md rounded-br-md bg-secondary px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
              {lang}
            </span>
          )}
          <CopyButton text={code.trim()} />
          <pre className="overflow-x-auto rounded-md bg-code p-3 pt-6 text-xs font-mono border border-border">
            <code className="!bg-transparent !p-0">{code.trim()}</code>
          </pre>
        </div>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="rounded bg-code px-1.5 py-0.5 text-xs font-mono text-primary">
          {part.slice(1, -1)}
        </code>
      );
    }
    const lines = part.split(/\n/);
    return (
      <span key={i}>
        {lines.map((line, li) => {
          const heading = line.match(/^(#{1,3})\s+(.*)$/);
          if (heading) {
            const level = heading[1].length;
            const content = heading[2];
            const cls =
              level === 1
                ? "text-lg font-bold font-mono mt-3 mb-1"
                : level === 2
                ? "text-base font-bold font-mono mt-3 mb-1"
                : "text-sm font-semibold mt-2 mb-1";
            return (
              <span key={li} className={`block ${cls}`}>
                {content}
              </span>
            );
          }
          if (/^\s*[-*]\s+/.test(line)) {
            return (
              <span key={li} className="block pl-4">
                • {line.replace(/^\s*[-*]\s+/, "")}
              </span>
            );
          }
          const bold = line.split(/(\*\*[^*]+\*\*)/g);
          return (
            <span key={li} className="block">
              {bold.map((b, bi) => {
                if (b.startsWith("**") && b.endsWith("**")) {
                  return (
                    <strong key={bi} className="font-semibold text-foreground">
                      {b.slice(2, -2)}
                    </strong>
                  );
                }
                return <span key={bi}>{b}</span>;
              })}
            </span>
          );
        })}
      </span>
    );
  });
}
