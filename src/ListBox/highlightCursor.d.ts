import type { Readable } from "svelte/store";

export const HIGHLIGHT_CURSOR_KEY: "carbon:ListBoxHighlight";

export function createHighlightCursor(): {
  register: (id: string, node: HTMLElement) => () => void;
  set: (id: string | null | undefined, options?: { scroll?: boolean }) => void;
  highlightedId: Pick<Readable<string | null>, "subscribe">;
};
