import type { Readable } from "svelte/store";

export const HIGHLIGHT_CURSOR_KEY: "carbon:ListBoxHighlight";

/**
 * Lets a listbox that renders its own option markup create the cursor and
 * hand it to `ListBoxMenu`, which uses it instead of making its own.
 */
export const HIGHLIGHT_CURSOR_OWNER_KEY: "carbon:ListBoxHighlightOwner";

export type HighlightCursor = ReturnType<typeof createHighlightCursor>;

export function createHighlightCursor(): {
  register: (id: string, node: HTMLElement, isActive?: boolean) => () => void;
  set: (id: string | null | undefined, options?: { scroll?: boolean }) => void;
  highlightedId: Pick<Readable<string | null>, "subscribe">;
};

/**
 * Svelte action: register an option node with a highlight cursor, the way
 * `ListBoxMenuItem` does, for listboxes that render plain option markup.
 */
export function highlightOption(
  node: HTMLElement,
  params: { cursor: HighlightCursor; id: string; active?: boolean },
): {
  update: (params: {
    cursor: HighlightCursor;
    id: string;
    active?: boolean;
  }) => void;
  destroy: () => void;
};
