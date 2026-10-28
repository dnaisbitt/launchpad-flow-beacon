// ALL backend network calls live here. UI components import from this file only.

export const USE_MOCK = true;

export const API_BASE_URL: string =
  (import.meta.env["VITE_API_BASE_URL"] as string | undefined) || "http://localhost:8000";

// ---- Contract types (placeholder: POST /api/submit { query } -> { result }) ----
export interface SubmitRequest {
  query: string;
}
export interface SubmitResponse {
  result: string;
}
export interface HealthResponse {
  status: "ok" | "down";
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export async function submitQuery(body: SubmitRequest): Promise<SubmitResponse> {
  if (USE_MOCK) {
    await delay(1000);
    if (body.query.toLowerCase().includes("error")) {
      throw new Error("Mock backend error: the server rejected this query.");
    }
    return {
      result: `Analysed "${body.query}". Found 3 key insights: relevance score 0.87, sentiment positive, and 12 related entities across your dataset.`,
    };
  }
  return request<SubmitResponse>("/api/submit", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getHealth(): Promise<HealthResponse> {
  if (USE_MOCK) {
    await delay(1000);
    return { status: "ok" };
  }
  return request<HealthResponse>("/health");
}
