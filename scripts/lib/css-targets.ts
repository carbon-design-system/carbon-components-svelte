import type { Targets } from "lightningcss";

// Svelte 5 minimum browsers — https://svelte.dev/docs/svelte/browser-support
export const BROWSERS = {
  chrome: "87",
  edge: "87",
  firefox: "83",
  safari: "14.1",
} as const;

/** A `major.minor.patch` version as lightningcss packs it: one byte each. */
export function encodeVersion(version: string): number {
  const [major = 0, minor = 0, patch = 0] = version.split(".").map(Number);
  return (major << 16) | (minor << 8) | patch;
}

export const targets: Targets = Object.fromEntries(
  Object.entries(BROWSERS).map(([browser, version]) => [
    browser,
    encodeVersion(version),
  ]),
);
