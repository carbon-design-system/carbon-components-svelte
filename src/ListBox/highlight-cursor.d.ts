import type { Readable } from "svelte/store";

export function createHighlightCursor(): {
  register: (id: string, node: HTMLElement, isActive?: boolean) => () => void;
  set: (id: string | null | undefined, options?: { scroll?: boolean }) => void;
  highlightedId: Pick<Readable<string | null>, "subscribe">;
};
