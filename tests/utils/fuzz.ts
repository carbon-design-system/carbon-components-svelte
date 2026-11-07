// Helpers for the fuzz and hang tests of parsers (see item 15x of the
// decisions: every parser ships with a test that no input hangs it).

/** A seeded generator (mulberry32), so a failing case can be replayed. */
export function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A string of `length` characters drawn from `alphabet`. */
export function randomString(
  next: () => number,
  length: number,
  alphabet: string,
): string {
  const chars = [...alphabet];
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(next() * chars.length)];
  }
  return out;
}

/** `count` pieces of `tokens`, joined: the shapes a parser has to read. */
export function tokenSoup(
  next: () => number,
  tokens: readonly string[],
  count: number,
): string {
  let out = "";
  for (let i = 0; i < count; i++) {
    out += tokens[Math.floor(next() * tokens.length)];
  }
  return out;
}

/** Every prefix and every suffix of `sample`. */
export function* prefixesAndSuffixes(sample: string): Generator<string> {
  for (let i = 0; i <= sample.length; i++) {
    yield sample.slice(0, i);
    yield sample.slice(i);
  }
}

/** Run `run` and return how long it took, in milliseconds. */
export function elapsed(run: () => void): number {
  const start = performance.now();
  run();
  return performance.now() - start;
}

/** Fail unless `run` finishes within `ms`. */
export function expectWithin(ms: number, run: () => void): void {
  const took = elapsed(run);
  if (took > ms) {
    throw new Error(`took ${Math.round(took)} ms, limit is ${ms} ms`);
  }
}
