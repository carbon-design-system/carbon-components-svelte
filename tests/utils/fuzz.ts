// Helpers for the fuzz and hang tests of parsers: random and seeded
// strings, every prefix and suffix of a sample, and a deadline, so a
// parser can show that no input hangs it.

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

type StringMethod =
  "charCodeAt" | "codePointAt" | "charAt" | "slice" | "substring";
const READS: readonly StringMethod[] = ["charCodeAt", "codePointAt", "charAt"];
const COPIES: readonly StringMethod[] = ["slice", "substring"];

/**
 * Count the characters `run` reads from strings: one for each `charCodeAt`,
 * `codePointAt` or `charAt` call, and the length of each `slice` or
 * `substring` it takes. Unlike a time, the count doesn't change with the
 * machine's load. Reads by index (`text[i]`) and inside regular
 * expressions aren't counted.
 */
export function countReads(run: () => void): number {
  const proto = String.prototype as unknown as Record<
    StringMethod,
    (this: string, ...args: number[]) => unknown
  >;
  const originals = new Map(
    [...READS, ...COPIES].map((name) => [name, proto[name]] as const),
  );
  let count = 0;
  for (const name of READS) {
    const original = originals.get(name)!;
    proto[name] = function (this: string, ...args: number[]) {
      count++;
      return original.apply(this, args);
    };
  }
  for (const name of COPIES) {
    const original = originals.get(name)!;
    proto[name] = function (this: string, ...args: number[]) {
      const copy = original.apply(this, args) as string;
      count += copy.length;
      return copy;
    };
  }
  try {
    run();
  } finally {
    for (const [name, original] of originals) proto[name] = original;
  }
  return count;
}

/**
 * Fail unless `run` reads its input in linear time: `build(size)` may read
 * at most 5 times as many characters as `build(size / 4)` (see
 * `countReads`), where linear code reads about 4 times as many and
 * quadratic code about 16. The full-size input runs, so a hang the count
 * can't see still fails the test by its timeout.
 */
export function expectLinear(
  build: (size: number) => string,
  run: (input: string) => void,
  size: number,
): void {
  const smallInput = build(Math.ceil(size / 4));
  const largeInput = build(size);
  const small = countReads(() => run(smallInput));
  const large = countReads(() => run(largeInput));
  const ratio = large / Math.max(small, 1);
  if (ratio > 5) {
    throw new Error(
      `4x the input read ${ratio.toFixed(1)}x as many characters (${small}, then ${large})`,
    );
  }
}
