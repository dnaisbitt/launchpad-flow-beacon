// ALL backend network calls live here. UI components import from this file only.

export const USE_MOCK = true;

// Runtime override so the header "Demo Mode" toggle can switch without a rebuild.
let mockEnabled = USE_MOCK;
export const isMockMode = () => mockEnabled;
export const setMockMode = (v: boolean) => {
  mockEnabled = v;
};

export const API_BASE_URL: string =
  (import.meta.env["VITE_API_BASE_URL"] as string | undefined) || "http://localhost:8000";

export type Stance = "for" | "against";

export interface DebateTurn {
  role: "user" | "ai";
  content: string;
}

export interface DebateRequest {
  topic: string;
  stance: Stance;
  user_message: string;
  history: DebateTurn[];
}

export interface DebateResponse {
  ai_response: string;
  round: number;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const MOCK_OPENERS = [
  "Let's begin. Your position on \"{topic}\" rests on an assumption you haven't proven: that today's trends will continue unchanged. History is full of confident predictions that collapsed under real-world complexity.",
];
const MOCK_REBUTTALS = [
  "You're conflating correlation with causation. The evidence you cite shows the two move together, but it says nothing about which drives the other — or whether a third factor drives both.",
  "That's an appealing anecdote, but anecdotes aren't data. Across larger samples, the effect you describe shrinks dramatically or disappears entirely.",
  "You've argued what *could* happen. I'm asking what *will* happen given real incentives. Markets, regulators, and people adapt — your model treats them as static.",
  "Consider the strongest version of my side: even granting your premise, the costs you ignore outweigh the benefits you highlight. Where's your accounting for those trade-offs?",
];

async function mockDebate(req: DebateRequest): Promise<DebateResponse> {
  await delay(1500);
  if (req.user_message.toLowerCase().includes("error")) {
    throw new Error("Mock backend error: the arena server rejected this rebuttal.");
  }
  const round = req.history.filter((t) => t.role === "user").length + (req.user_message ? 1 : 0);
  const text = req.user_message
    ? MOCK_REBUTTALS[round % MOCK_REBUTTALS.length]
    : MOCK_OPENERS[0].replace("{topic}", req.topic);
  return { ai_response: text, round };
}

export async function sendDebate(req: DebateRequest): Promise<DebateResponse> {
  if (mockEnabled) return mockDebate(req);
  const res = await fetch(`${API_BASE_URL}/api/debate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed (${res.status})`);
  }
  return res.json() as Promise<DebateResponse>;
}
