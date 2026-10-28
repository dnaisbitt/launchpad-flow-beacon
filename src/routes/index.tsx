import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Bot, Loader2, Send, Swords, Trophy, User, RotateCcw, Zap } from "lucide-react";
import { sendDebate, isMockMode, setMockMode, type DebateTurn, type Stance } from "@/lib/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DebateArena AI — Argue against an AI opponent" },
      { name: "description", content: "Pick a topic, choose a side, and battle an AI debater round by round." },
      { property: "og:title", content: "DebateArena AI" },
      { property: "og:description", content: "Pick a topic, choose a side, and battle an AI debater round by round." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Arena,
});

const PRESETS = [
  "AI will replace coders",
  "Social media does more harm than good",
  "Remote work beats the office",
  "Space exploration is worth the cost",
];
const MAX_CHARS = 600;

function Arena() {
  const [mock, setMock] = useState(isMockMode());
  const [topic, setTopic] = useState("");
  const [stance, setStance] = useState<Stance>("for");
  const [started, setStarted] = useState(false);
  const [history, setHistory] = useState<DebateTurn[]>([]);
  const [aiText, setAiText] = useState("");
  const [round, setRound] = useState(0);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [history]);

  const toggleMock = () => {
    setMockMode(!mock);
    setMock(!mock);
    toast(mock ? "Live API mode" : "Demo mode on", { description: mock ? "Requests go to your backend." : "Using mock responses." });
  };

  async function call(userMessage: string, prior: DebateTurn[]) {
    setLoading(true);
    try {
      const res = await sendDebate({ topic, stance, user_message: userMessage, history: prior });
      const next: DebateTurn[] = [...prior, ...(userMessage ? [{ role: "user" as const, content: userMessage }] : []), { role: "ai", content: res.ai_response }];
      setHistory(next);
      setAiText(res.ai_response);
      setRound(res.round);
      return true;
    } catch (e) {
      toast.error("The AI opponent didn't respond", { description: e instanceof Error ? e.message : String(e) });
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function start() {
    if (!topic.trim() || loading) return;
    setStarted(true);
    setHistory([]);
    setAiText("");
    const ok = await call("", []);
    if (!ok) setStarted(false);
  }

  async function sendRebuttal(e: React.FormEvent) {
    e.preventDefault();
    const msg = reply.trim();
    if (!msg || loading) return;
    if (await call(msg, history)) setReply("");
  }

  function reset() {
    setStarted(false);
    setHistory([]);
    setAiText("");
    setRound(0);
    setReply("");
  }

  return (
    <div className="arena-bg min-h-screen text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-neon shadow-glow">
              <Swords className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">
              DebateArena <span className="text-gradient-neon">AI</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleMock} disabled={loading} className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium transition hover:border-primary/60 disabled:opacity-50" aria-pressed={mock}>
              <span className={`relative h-4 w-7 rounded-full transition ${mock ? "bg-primary" : "bg-muted"}`}>
                <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-foreground transition-all ${mock ? "left-3.5" : "left-0.5"}`} />
              </span>
              <span className="hidden sm:inline">Demo Mode</span>
            </button>
            <div className="flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 font-mono text-xs text-accent">
              <Trophy className="h-3.5 w-3.5" /> Round {round}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-5 py-10">
        {/* Setup */}
        <section className="rounded-xl border border-border bg-card/60 p-6 backdrop-blur">
          <h1 className="font-display text-3xl font-bold md:text-4xl">Choose your battle</h1>
          <p className="mt-1 text-sm text-muted-foreground">Pick a topic, take a side, and defend it against the AI.</p>

          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={started || loading}
            placeholder="Enter the topic or statement you want to debate..."
            className="mt-5 w-full rounded-xl border border-input bg-background/60 px-4 py-3 outline-none transition focus:border-primary focus:shadow-glow disabled:opacity-60"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button key={p} disabled={started || loading} onClick={() => setTopic(p)} className={`rounded-full border px-3 py-1 text-xs transition disabled:opacity-50 ${topic === p ? "border-primary bg-primary/15 text-foreground" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}>
                {p}
              </button>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex rounded-xl border border-border bg-background/60 p-1">
              {(["for", "against"] as Stance[]).map((s) => (
                <button key={s} disabled={started || loading} onClick={() => setStance(s)} className={`rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-60 ${stance === s ? (s === "for" ? "bg-accent text-accent-foreground" : "bg-destructive text-destructive-foreground") : "text-muted-foreground hover:text-foreground"}`}>
                  Argue {s.toUpperCase()}
                </button>
              ))}
            </div>
            {started ? (
              <button onClick={reset} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-medium transition hover:border-primary/60 disabled:opacity-50">
                <RotateCcw className="h-4 w-4" /> New debate
              </button>
            ) : (
              <button onClick={start} disabled={!topic.trim() || loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-neon px-6 py-3 font-semibold text-primary-foreground shadow-glow transition hover:scale-[1.02] disabled:scale-100 disabled:opacity-40 disabled:shadow-none">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                {loading ? "Entering arena…" : "Start Debate"}
              </button>
            )}
          </div>
        </section>

        {/* Arena */}
        {started && (
          <section className="grid gap-6 lg:grid-cols-2">
            <div className={`rounded-xl border bg-card p-6 transition ${loading ? "border-primary shadow-glow" : "border-border"}`}>
              <div className="flex items-center gap-3">
                <div className={`grid h-11 w-11 place-items-center rounded-full bg-gradient-neon ${loading ? "animate-pulse" : ""}`}>
                  <Bot className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-display font-semibold">AI Opponent</p>
                  <p className="font-mono text-xs text-muted-foreground">Arguing {stance === "for" ? "AGAINST" : "FOR"}</p>
                </div>
              </div>
              <div className="mt-5 min-h-40">
                {loading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-sm">Thinking</span>
                    <span className="typing-dot" /><span className="typing-dot [animation-delay:150ms]" /><span className="typing-dot [animation-delay:300ms]" />
                  </div>
                ) : (
                  <p className="animate-in fade-in slide-in-from-bottom-2 leading-relaxed duration-500">{aiText}</p>
                )}
              </div>
            </div>

            <form onSubmit={sendRebuttal} className="flex flex-col rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full border border-accent/50 bg-accent/10">
                  <User className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="font-display font-semibold">Your Rebuttal</p>
                  <p className="font-mono text-xs text-muted-foreground">Arguing {stance.toUpperCase()}</p>
                </div>
              </div>
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value.slice(0, MAX_CHARS))}
                disabled={loading}
                rows={6}
                placeholder="Counter their argument…"
                className="mt-5 flex-1 resize-none rounded-xl border border-input bg-background/60 p-4 outline-none transition focus:border-accent disabled:opacity-60"
              />
              <div className="mt-3 flex items-center justify-between">
                <span className={`font-mono text-xs ${reply.length > MAX_CHARS * 0.9 ? "text-destructive" : "text-muted-foreground"}`}>{reply.length}/{MAX_CHARS}</span>
                <button type="submit" disabled={!reply.trim() || loading} className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:opacity-40">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {loading ? "Sending…" : "Send Rebuttal"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* History */}
        {history.length > 0 && (
          <section className="rounded-xl border border-border bg-card/60 p-6">
            <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Debate log</h2>
            <div ref={logRef} className="mt-4 max-h-96 space-y-3 overflow-y-auto pr-2">
              {history.map((t, i) => (
                <div key={i} className={`flex ${t.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${t.role === "user" ? "border border-accent/30 bg-accent/10" : "border border-primary/30 bg-primary/10"}`}>
                    <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{t.role === "user" ? "You" : "AI"}</p>
                    {t.content}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
