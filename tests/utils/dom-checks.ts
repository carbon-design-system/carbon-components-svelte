/**
 * Leaves DOM checks out for the rest of the current test, for a test that
 * builds markup a rule rejects on purpose (a consumer forcing a tile button
 * around a link). See `dom-check-runner.ts`.
 */
export function skipDomChecks(...rules: string[]) {
  const skip = ((
    globalThis as { __domChecksSkip?: Set<string> }
  ).__domChecksSkip ??= new Set());
  for (const rule of rules) skip.add(rule);
}
