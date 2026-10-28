// Pure, frontend-only scoring for the arena "health / confidence" bars.
// The backend contract has no strength score, so we estimate from the rebuttal.

const EVIDENCE_WORDS = ["because", "evidence", "study", "data", "for example", "research", "therefore", "%"];

/** Damage (0–30) a user rebuttal deals to the AI. Short / unsupported = weak. */
export function rebuttalDamage(text: string): number {
  const t = text.toLowerCase();
  const words = t.split(/\s+/).filter(Boolean).length;
  let dmg = Math.min(15, Math.floor(words / 4));
  dmg += EVIDENCE_WORDS.filter((w) => t.includes(w)).length * 4;
  return Math.min(30, Math.max(3, dmg));
}

/** Damage the AI's counter deals back: hits harder when the rebuttal was weak. */
export function counterDamage(userDamage: number): number {
  return Math.max(5, 25 - userDamage);
}

export const isWeak = (damage: number) => damage < 10;
