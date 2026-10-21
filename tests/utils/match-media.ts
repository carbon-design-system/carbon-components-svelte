type Listener = (event: { matches: boolean; media: string }) => void;

const BOUND = /\((min|max)-width:\s*([\d.]+)px\)/;

function matchesQuery(query: string, width: number) {
  return query.split(" and ").every((part) => {
    const [, bound, value] = BOUND.exec(part) ?? [];
    if (bound === undefined) return false;
    return bound === "min" ? width >= Number(value) : width <= Number(value);
  });
}

/**
 * Stubs `window.matchMedia` for a viewport `width`. Evaluates `min-width` and
 * `max-width` inclusively, like a browser, so boundary widths match both
 * adjacent queries. `setWidth` fires `change` only on lists whose match flipped.
 */
export function stubViewport(width: number) {
  const lists: { media: string; matches: boolean; listeners: Listener[] }[] =
    [];

  vi.stubGlobal("matchMedia", (media: string) => {
    const list = {
      media,
      matches: matchesQuery(media, width),
      listeners: [] as Listener[],
    };
    lists.push(list);
    return {
      get matches() {
        return list.matches;
      },
      media,
      addEventListener: (_type: string, listener: Listener) =>
        list.listeners.push(listener),
      removeEventListener: vi.fn(),
    };
  });

  return {
    setWidth(next: number) {
      const flipped = lists.filter(
        (list) => matchesQuery(list.media, next) !== list.matches,
      );
      for (const list of flipped) list.matches = !list.matches;
      for (const list of flipped) {
        for (const listener of list.listeners) {
          listener({ matches: list.matches, media: list.media });
        }
      }
    },
  };
}
