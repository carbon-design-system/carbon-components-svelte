import type { TokenSuggestion } from "./token-suggest.js";

export type SuggestState = {
  status: "idle" | "loading" | "ready" | "error";
  /** The latest results. Kept while a newer query loads. */
  items: TokenSuggestion[];
  /** The query `items` answer, or the one loading. */
  query: string;
};

export type SuggestRequest = {
  /** What can be shown without waiting. */
  known: (query: string) => TokenSuggestion[];
  /** A source that may take a while. */
  load?:
    | ((
        query: string,
        signal: AbortSignal,
      ) => TokenSuggestion[] | Promise<TokenSuggestion[]>)
    | undefined;
  limit: number;
  /** Milliseconds to wait before calling `load`. */
  debounce: number;
  /** What the request is for, such as the key. A new one drops the old results. */
  id: string;
};

export function createSuggestSource(onChange: (state: SuggestState) => void): {
  ask: (request: SuggestRequest, query: string) => void;
  reset: () => void;
  getState: () => SuggestState;
};
