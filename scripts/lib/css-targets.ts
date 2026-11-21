import type { Targets } from "lightningcss";

// Baseline Widely available, pinned (#5288). Move it only in a minor
// release, so a patch never drops a browser.
export const BROWSERS = {
  chrome: "124",
  edge: "124",
  firefox: "125",
  safari: "17.4",
  ios_saf: "17.4",
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
