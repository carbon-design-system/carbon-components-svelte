import type { Readable } from "svelte/store";

export interface MediaQueryOptions {
  /**
   * Value the store holds until the first evaluation, and permanently when
   * `matchMedia` is unavailable (SSR, old test runners).
   * @default undefined
   */
  fallback?: boolean;
}

/**
 * Framework-agnostic: evaluates `query` once, calls `callback(matches)`
 * immediately, then again on every change. Returns a cleanup function.
 * Returns a no-op cleanup without calling `callback` when `window` or
 * `window.matchMedia` is missing.
 * @param query
 * @param callback
 */
export function observeMediaQuery(
  query: string,
  callback: (matches: boolean) => void,
): () => void;

/**
 * Readable store of whether `query` currently matches.
 * @param query
 * @param options
 */
export function mediaQuery(
  query: string,
  options?: MediaQueryOptions,
): Readable<boolean | undefined>;

/** `(prefers-reduced-motion: reduce)` */
export function prefersReducedMotion(
  options?: MediaQueryOptions,
): Readable<boolean | undefined>;

export interface PrefersColorSchemeOptions {
  fallback?: "dark" | "light";
}

/**
 * Readable of `"dark" | "light" | undefined` from `(prefers-color-scheme: dark)`.
 * @param options
 */
export function prefersColorScheme(
  options?: PrefersColorSchemeOptions,
): Readable<"dark" | "light" | undefined>;

export interface OrientationOptions {
  fallback?: "portrait" | "landscape";
}

/**
 * Readable of `"portrait" | "landscape" | undefined` from `(orientation: portrait)`.
 * @param options
 */
export function orientation(
  options?: OrientationOptions,
): Readable<"portrait" | "landscape" | undefined>;
