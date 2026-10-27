// @vitest-environment node
import { get } from "svelte/store";
import {
  prefersReducedMotion,
  shouldReduceMotion,
} from "../../src/motion/reduced-motion.js";

type Listener = (event: { matches: boolean }) => void;

function stubReducedMotion(matches: boolean) {
  const listeners = new Set<Listener>();
  const list = {
    matches,
    addEventListener: vi.fn((_type: string, listener: Listener) =>
      listeners.add(listener),
    ),
    removeEventListener: vi.fn((_type: string, listener: Listener) =>
      listeners.delete(listener),
    ),
  };
  const matchMedia = vi.fn(() => list);
  vi.stubGlobal("window", { matchMedia });
  return {
    matchMedia,
    list,
    listeners,
    change(next: boolean) {
      list.matches = next;
      for (const listener of listeners) listener({ matches: next });
    },
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("reduced motion", () => {
  it("is false without a window", () => {
    expect(shouldReduceMotion()).toBe(false);
    expect(get(prefersReducedMotion)).toBe(false);
  });

  it("is false when matchMedia is missing", () => {
    vi.stubGlobal("window", {});
    expect(shouldReduceMotion()).toBe(false);
    expect(get(prefersReducedMotion)).toBe(false);
  });

  it("shouldReduceMotion reads the current preference", () => {
    const media = stubReducedMotion(true);
    expect(shouldReduceMotion()).toBe(true);
    media.list.matches = false;
    expect(shouldReduceMotion()).toBe(false);
    expect(media.matchMedia).toHaveBeenCalledWith(
      "(prefers-reduced-motion: reduce)",
    );
  });

  it("the store starts at the current value and follows change events", () => {
    const media = stubReducedMotion(true);
    const values: boolean[] = [];
    const unsubscribe = prefersReducedMotion.subscribe((v) => values.push(v));
    media.change(false);
    media.change(true);
    unsubscribe();
    expect(values).toEqual([true, false, true]);
  });

  it("shares one query and listener across subscribers, then releases it", () => {
    const media = stubReducedMotion(false);
    const stopA = prefersReducedMotion.subscribe(() => {});
    const stopB = prefersReducedMotion.subscribe(() => {});
    expect(media.matchMedia).toHaveBeenCalledTimes(1);
    expect(media.listeners.size).toBe(1);
    stopA();
    expect(media.listeners.size).toBe(1);
    stopB();
    expect(media.listeners.size).toBe(0);
  });
});
