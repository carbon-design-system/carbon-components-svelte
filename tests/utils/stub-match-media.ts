type Size = "sm" | "md" | "lg" | "xlg" | "max";

/**
 * Stub `window.matchMedia`; `matches(query)` decides each list. Returns a
 * `fire(query, matches)` that invokes the change listeners registered for
 * that exact query string.
 */
export function stubMatchMedia(matches: (query: string) => boolean) {
  const listenersByQuery = new Map<
    string,
    Array<(event: { matches: boolean; media: string }) => void>
  >();

  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: matches(query),
    media: query,
    addEventListener: vi.fn(
      (
        event: string,
        listener: (event: { matches: boolean; media: string }) => void,
      ) => {
        if (event !== "change") return;
        if (!listenersByQuery.has(query)) listenersByQuery.set(query, []);
        listenersByQuery.get(query)?.push(listener);
      },
    ),
    removeEventListener: vi.fn(
      (
        event: string,
        listener: (event: { matches: boolean; media: string }) => void,
      ) => {
        if (event !== "change") return;
        const listeners = listenersByQuery.get(query);
        if (!listeners) return;
        const index = listeners.indexOf(listener);
        if (index !== -1) listeners.splice(index, 1);
      },
    ),
  }));

  function fire(query: string, isMatch: boolean) {
    const listeners = listenersByQuery.get(query) ?? [];
    for (const listener of listeners) {
      listener({ matches: isMatch, media: query });
    }
  }

  return { fire };
}

/**
 * Stub so exactly one Carbon breakpoint range matches (queries copied from
 * `tests/Breakpoint/HideAtBreakpoint.test.ts` `stubMatchMediaForSize`).
 */
export function stubMatchMediaForSize(size: Size) {
  const isMatch: Record<Size, (query: string) => boolean> = {
    sm: (query) => query.includes("(max-width: 672px)"),
    md: (query) => query.includes("(min-width: 672px) and (max-width: 1056px)"),
    lg: (query) =>
      query.includes("(min-width: 1056px) and (max-width: 1312px)"),
    xlg: (query) =>
      query.includes("(min-width: 1312px) and (max-width: 1584px)"),
    max: (query) => query.includes("(min-width: 1584px)"),
  };

  return stubMatchMedia(isMatch[size]);
}

/** `vi.stubGlobal("matchMedia", undefined)` for the missing-API path. */
export function stubMissingMatchMedia() {
  vi.stubGlobal("matchMedia", undefined);
}
