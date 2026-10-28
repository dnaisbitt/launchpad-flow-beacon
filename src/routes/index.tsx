import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Swords, Trophy, RotateCcw, Zap } from "lucide-react";
import playerImg from "@/assets/player.png";
import bossImg from "@/assets/ai-boss.png";
import { rebuttalDamage, counterDamage, isWeak } from "@/lib/combat";
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
  const [playerHp, setPlayerHp] = useState(100);
  const [aiHp, setAiHp] = useState(100);
  const [hit, setHit] = useState<"player" | "boss" | null>(null);
  const [mood, setMood] = useState<{ label: string; tone: string }>({ label: "Smug", tone: "calm" });
  const ended = playerHp <= 0 || aiHp <= 0;
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
    setMood({ label: "Thinking...", tone: "think" });
    try {
      const res = await sendDebate({ topic, stance, user_message: userMessage, history: prior });
      const next: DebateTurn[] = [...prior, ...(userMessage ? [{ role: "user" as const, content: userMessage }] : []), { role: "ai", content: res.ai_response }];
      setHistory(next);
      setAiText(res.ai_response);
      setRound(res.round);
      if (userMessage) {
        const dmg = rebuttalDamage(userMessage);
        setAiHp((h) => Math.max(0, h - dmg));
        setHit("boss");
        setTimeout(() => {
          setPlayerHp((h) => Math.max(0, h - counterDamage(dmg)));
          setHit("player");
          setTimeout(() => setHit(null), 500);
        }, 600);
        setMood(dmg >= 20 ? { label: "Defensive!", tone: "hurt" } : isWeak(dmg) ? { label: "Amused", tone: "calm" } : { label: "Irritated", tone: "angry" });
        if (isWeak(dmg)) toast("Weak strike!", { description: "Back it up with evidence or reasoning." });
      } else setMood({ label: "Smug", tone: "calm" });
      return true;
    } catch (e) {
      setMood({ label: "Stunned", tone: "angry" });
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
    setPlayerHp(100);
    setAiHp(100);
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
    setPlayerHp(100);
    setAiHp(100);
  }

  return (
    <div className="arena-bg min-h-screen font-sans text-foreground">
      <header className="sticky top-0 z-20 bg-k-ink/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="grid h-11 w-11 rotate-[-6deg] place-items-center rounded-2xl bg-k-red pop-shadow-sm">
              <Swords className="h-6 w-6 text-foreground" strokeWidth={3} />
            </div>
            <span className="font-display text-2xl font-bold tracking-tight text-stroke">
              DebateArena <span className="text-k-yellow">AI!</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleMock} disabled={loading} className="bouncy flex items-center gap-2 rounded-full bg-card px-3 py-2 text-xs font-extrabold text-card-foreground pop-shadow-sm disabled:opacity-50" aria-pressed={mock}>
              <span className={`relative h-5 w-9 rounded-full transition ${mock ? "bg-k-green" : "bg-muted"}`}>
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-card shadow transition-all ${mock ? "left-4.5" : "left-0.5"}`} />
              </span>
              <span className="hidden sm:inline">Demo Mode</span>
            </button>
            <div className="flex items-center gap-1.5 rounded-full bg-k-yellow px-4 py-2 font-display text-sm font-bold text-k-ink pop-shadow-sm">
              <Trophy className="h-4 w-4" strokeWidth={3} /> Round {round}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-5 py-10">
        <section className="rounded-3xl bg-card p-6 text-card-foreground pop-shadow md:p-8">
          <h1 className="font-display text-3xl font-bold md:text-5xl">Choose your battle!</h1>
          <p className="mt-1 font-bold text-muted-foreground">Pick a topic, take a side, and defend it against the AI.</p>

          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={started || loading}
            placeholder="Enter the topic or statement you want to debate..."
            className="mt-5 w-full rounded-2xl border-4 border-border bg-secondary px-5 py-4 text-lg font-bold outline-none transition focus:border-k-purple disabled:opacity-60"
          />
          <div className="mt-4 flex flex-wrap gap-2">
            {PRESETS.map((p, i) => (
              <button key={p} disabled={started || loading} onClick={() => setTopic(p)} className={`bouncy rounded-full px-4 py-2 text-sm font-extrabold text-foreground pop-shadow-sm disabled:opacity-50 ${COLORS[i % 4]} ${topic === p ? "ring-4 ring-k-ink" : ""}`}>
                {SHAPES[i % 4]} {p}
              </button>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              {(["for", "against"] as Stance[]).map((s) => (
                <button key={s} disabled={started || loading} onClick={() => setStance(s)} className={`bouncy rounded-2xl px-5 py-3 font-display text-lg font-bold text-foreground pop-shadow-sm disabled:opacity-60 ${s === "for" ? "bg-k-green" : "bg-k-red"} ${stance === s ? "ring-4 ring-k-ink" : "opacity-60"}`}>
                  {s === "for" ? "👍" : "👎"} Argue {s.toUpperCase()}
                </button>
              ))}
            </div>
            {started ? (
              <button onClick={reset} disabled={loading} className="bouncy inline-flex items-center justify-center gap-2 rounded-2xl bg-secondary px-6 py-3 font-display text-lg font-bold pop-shadow-sm disabled:opacity-50">
                <RotateCcw className="h-5 w-5" strokeWidth={3} /> New debate
              </button>
            ) : (
              <button onClick={start} disabled={!topic.trim() || loading} className="bouncy inline-flex items-center justify-center gap-2 rounded-2xl bg-k-purple px-8 py-4 font-display text-xl font-bold text-foreground pop-shadow disabled:opacity-40">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" strokeWidth={3} />}
                {loading ? "Entering arena…" : "Start Debate!"}
              </button>
            )}
          </div>
        </section>

        {started && (
          <section className="space-y-8">
            <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-4">
              <Fighter side="player" name="You" sub={`Team ${stance.toUpperCase()}`} img={playerImg} hp={playerHp} hit={hit === "player"} />
              <div className="vs-badge mb-28 grid h-16 w-16 place-items-center rounded-full bg-k-yellow font-display text-2xl font-bold text-k-ink pop-shadow md:h-20 md:w-20 md:text-3xl">VS</div>
              <Fighter side="boss" name="Logos the Unbending" sub={`Team ${stance === "for" ? "AGAINST" : "FOR"}`} img={bossImg} hp={aiHp} hit={hit === "boss"} />
            </div>

            <div className={`speech-tail relative rounded-3xl bg-k-purple p-6 pt-8 pop-shadow transition md:p-8 ${loading ? "scale-[1.01]" : ""}`}>
              <div className="absolute -top-5 left-6 flex items-center gap-2">
                <span className="rounded-full bg-k-red px-4 py-1.5 font-display text-sm font-bold pop-shadow-sm">🤖 LOGOS</span>
                <span key={mood.label} className={`mood-badge rounded-full px-3 py-1.5 font-display text-sm font-bold pop-shadow-sm ${MOOD[mood.tone] ?? MOOD.calm}`}>{mood.label}</span>
              </div>
              <div className="min-h-24">
                {loading ? (
                  <div className="flex items-center gap-2">
                    <span className="font-display text-lg font-bold">Thinking up a comeback</span>
                    <span className="typing-dot" /><span className="typing-dot [animation-delay:150ms]" /><span className="typing-dot [animation-delay:300ms]" />
                  </div>
                ) : (
                  <p key={aiText} className="typewriter text-xl font-extrabold leading-relaxed text-stroke">{aiText}</p>
                )}
              </div>
            </div>

            <form onSubmit={sendRebuttal} className="rounded-3xl bg-card p-5 text-card-foreground pop-shadow md:p-6">
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded-full bg-k-cyan px-3 py-1 font-display text-sm font-bold text-foreground">🎯 Your move</span>
                <span className={`font-mono text-xs font-bold ${reply.length > MAX_CHARS * 0.9 ? "text-destructive" : "text-muted-foreground"}`}>{reply.length}/{MAX_CHARS}</span>
              </div>
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value.slice(0, MAX_CHARS))}
                disabled={loading || ended}
                rows={4}
                placeholder={ended ? "The battle is over." : "Type your rebuttal — evidence and reasoning hit harder…"}
                className="w-full resize-none rounded-2xl border-4 border-border bg-secondary p-4 text-base font-bold outline-none transition focus:border-k-cyan disabled:opacity-60"
              />
              <div className="mt-4 flex justify-end">
                <button type="submit" disabled={!reply.trim() || loading || ended} className="bouncy inline-flex items-center gap-3 rounded-full bg-k-red px-10 py-4 font-display text-xl font-bold text-foreground pop-shadow ring-4 ring-k-yellow disabled:opacity-40">
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <span>⚔️</span>}
                  {loading ? "Striking…" : "Fire Rebuttal"}
                </button>
              </div>
            </form>
            {ended && (
              <div className={`mood-badge rounded-3xl p-6 text-center font-display text-3xl font-bold pop-shadow ${aiHp <= 0 ? "bg-k-green" : "bg-k-red"}`}>
                {aiHp <= 0 ? "🏆 Victory! The AI concedes." : "💀 Defeated. Try a new debate."}
              </div>
            )}
          </section>
        )}

        {history.length > 0 && (
          <section className="rounded-3xl bg-card p-6 text-card-foreground pop-shadow">
            <h2 className="font-display text-2xl font-bold">📜 Battle log</h2>
            <div ref={logRef} className="mt-4 max-h-96 space-y-3 overflow-y-auto pr-2">
              {history.map((t, i) => {
                const c = t.role === "user" ? ["bg-k-cyan", "bg-k-green"][i % 2] : ["bg-k-red", "bg-k-purple"][i % 2];
                return (
                  <div key={i} className={`flex ${t.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`mood-badge max-w-[85%] rounded-2xl px-5 py-3 font-bold leading-relaxed text-foreground pop-shadow-sm ${c}`}>
                      <p className="mb-1 flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-wider">
                        <span className="grid h-5 w-5 place-items-center rounded-md bg-foreground/25 text-[10px]">{SHAPES[i % 4]}</span>
                        {t.role === "user" ? "You" : "AI"}
                      </p>
                      {t.content}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

const COLORS = ["bg-k-red", "bg-k-cyan", "bg-k-yellow text-k-ink", "bg-k-green"];
const SHAPES = ["▲", "◆", "●", "■"];
const MOOD: Record<string, string> = {
  calm: "bg-card text-card-foreground",
  think: "bg-k-yellow text-k-ink",
  hurt: "bg-k-cyan text-foreground",
  angry: "bg-k-red text-foreground",
};

function Fighter({ side, name, sub, img, hp, hit }: { side: "player" | "boss"; name: string; sub: string; img: string; hp: number; hit: boolean }) {
  const isPlayer = side === "player";
  const bar = hp > 60 ? "bg-k-green" : hp > 30 ? "bg-k-yellow" : "bg-k-red";
  return (
    <div className={`flex flex-col ${isPlayer ? "items-start" : "items-end"}`}>
      <div className="mb-4 w-full">
        <div className={`flex items-center justify-between gap-2 ${isPlayer ? "" : "flex-row-reverse"}`}>
          <span className={`rounded-full px-3 py-1 font-display text-sm font-bold pop-shadow-sm ${isPlayer ? "bg-k-cyan" : "bg-k-red"}`}>{isPlayer ? "◆" : "▲"} {name}</span>
          <span className="rounded-full bg-card px-3 py-1 font-display text-sm font-bold text-card-foreground pop-shadow-sm">{hp} HP</span>
        </div>
        <div className="hp-track mt-2 h-6 overflow-hidden rounded-full">
          <div className={`hp-fill h-full rounded-full ${bar} ${isPlayer ? "" : "ml-auto"}`} style={{ width: `${hp}%` }} />
        </div>
        <p className={`mt-1 text-xs font-extrabold uppercase tracking-wider text-foreground/80 ${isPlayer ? "" : "text-right"}`}>Confidence · {sub}</p>
      </div>
      <div className={`avatar ${isPlayer ? "bg-k-cyan" : "avatar-boss bg-k-purple"} ${hit ? "fighter-hit" : ""} ${hp <= 0 ? "opacity-50 grayscale" : ""}`}>
        <img src={img} alt={name} width={816} height={816} className={`fighter-img ${isPlayer ? "" : "-scale-x-100"}`} />
      </div>
    </div>
  );
}
