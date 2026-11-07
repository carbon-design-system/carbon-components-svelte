import type { MentionItem } from "./filter-mention-items.js";

export type MentionSourceContext = {
  signal: AbortSignal;
  trigger: string;
};

export type MentionItems =
  | ReadonlyArray<MentionItem>
  | ((
      query: string,
      context: MentionSourceContext,
    ) => ReadonlyArray<MentionItem> | Promise<ReadonlyArray<MentionItem>>);

export type MentionSourceState = {
  status: "idle" | "loading" | "ready" | "error";
  /** The latest results. Kept while a newer query loads. */
  items: MentionItem[];
  query: string;
};

export type MentionSourceRequest = {
  char: string;
  items: MentionItems;
  limit: number;
  /** Milliseconds to wait before calling a function source. */
  debounce: number;
  filter?: (
    items: ReadonlyArray<MentionItem>,
    query: string,
  ) => ReadonlyArray<MentionItem>;
};

export function createMentionSource(
  onChange: (state: MentionSourceState) => void,
): {
  request: (request: MentionSourceRequest, query: string) => void;
  reset: () => void;
  getState: () => MentionSourceState;
};
