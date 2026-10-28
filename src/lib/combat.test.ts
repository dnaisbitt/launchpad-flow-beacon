import { describe, it, expect } from "vitest";
import { rebuttalDamage, counterDamage, isWeak } from "./combat";

describe("combat scoring", () => {
  it("a one-word rebuttal is weak and deals minimum damage", () => {
    expect(rebuttalDamage("No")).toBe(3);
    expect(isWeak(rebuttalDamage("No"))).toBe(true);
  });
  it("evidence-backed rebuttals hit harder, capped at 30", () => {
    const strong = "Because research and data from a study show 40% gains, therefore " + "word ".repeat(60);
    expect(rebuttalDamage(strong)).toBe(30);
  });
  it("AI counter hits harder after a weak rebuttal", () => {
    expect(counterDamage(3)).toBe(22);
    expect(counterDamage(30)).toBe(5);
  });
});
