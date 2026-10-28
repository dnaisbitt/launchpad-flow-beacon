import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Loader2, Sparkles, Activity, Trash2 } from "lucide-react";
import { submitQuery, getHealth, USE_MOCK, API_BASE_URL } from "@/lib/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Signal — Query Console" },
      { name: "description", content: "Send a query to the backend and get instant results." },
      { property: "og:title", content: "Signal — Query Console" },
      { property: "og:description", content: "Send a query to the backend and get instant results." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

interface Entry {
  id: number;
  query: string;
  result: string;
}

function Index() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Entry[]>([]);
  const [health, setHealth] = useState<"loading" | "ok" | "down">("loading");

  useEffect(() => {
    getHealth()
      .then((h) => setHealth(h.status))
      .catch(() => {
        setHealth("down");
        toast.error("Backend unreachable", { description: API_BASE_URL });
      });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || loading) return;
    setLoading(true);
    try {
      const res = await submitQuery({ query: query.trim() });
      setHistory((h) => [{ id: Date.now(), query: query.trim(), result: res.result }, ...h]);
      setQuery("");
      toast.success("Result ready");
    } catch (err) {
      toast.error("Request failed", { description: err instanceof Error ? err.message : String(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 font-display text-lg font-bold">
            <Sparkles className="h-5 w-5 text-primary" /> Signal
          </div>
          <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground">
            {USE_MOCK && <span className="rounded-full bg-accent px-2 py-1 text-accent-foreground">MOCK MODE</span>}
            <span className="flex items-center gap-1.5">
              {health === "loading" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Activity className={health === "ok" ? "h-3.5 w-3.5 text-success" : "h-3.5 w-3.5 text-destructive"} />
              )}
              {health === "loading" ? "checking" : health}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="font-display text-5xl font-bold tracking-tight text-foreground md:text-6xl">
          Ask anything<span className="text-primary">.</span>
        </h1>
        <p className="mt-3 max-w-lg text-muted-foreground">
          Type a query and the backend will process it. Try including “error” to see failure handling.
        </p>

        <form onSubmit={onSubmit} className="mt-10 flex gap-2 rounded-2xl border border-border bg-card p-2 shadow-soft">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
            placeholder="e.g. Summarise last week's sales"
            className="flex-1 bg-transparent px-4 py-3 text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {loading ? "Running" : "Submit"}
          </button>
        </form>

        <section className="mt-12 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Results</h2>
            {history.length > 0 && (
              <button onClick={() => setHistory([])} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <Trash2 className="h-3.5 w-3.5" /> Clear
              </button>
            )}
          </div>

          {loading && (
            <div className="animate-pulse rounded-2xl border border-border bg-card p-6">
              <div className="h-3 w-1/3 rounded bg-muted" />
              <div className="mt-4 h-3 w-full rounded bg-muted" />
              <div className="mt-2 h-3 w-4/5 rounded bg-muted" />
            </div>
          )}

          {!loading && history.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No results yet.
            </div>
          )}

          {history.map((h) => (
            <article key={h.id} className="rounded-2xl border border-border bg-card p-6">
              <p className="font-mono text-xs text-primary">› {h.query}</p>
              <p className="mt-3 leading-relaxed text-card-foreground">{h.result}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
