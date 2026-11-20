import type { PersonLike } from "./filter-people.js";

export type PersonSourceState<T extends PersonLike> = {
  status: "idle" | "loading" | "ready" | "error";
  /** The latest results. Kept while a newer query loads. */
  items: T[];
  query: string;
  /** Why a request failed, with `status` `"error"`. */
  error?: unknown;
};

export type PersonSourceRequest<T extends PersonLike> = {
  items:
    | ReadonlyArray<T>
    | ((
        query: string,
        context: { signal: AbortSignal },
      ) => ReadonlyArray<T> | Promise<ReadonlyArray<T>>);
  limit: number;
  /** Milliseconds to wait before calling a function source. */
  debounce: number;
  /** Skips a person, such as one already chosen. */
  exclude?: (person: T) => boolean;
  filter?: (items: ReadonlyArray<T>, query: string) => ReadonlyArray<T>;
};

export function createPersonSource<T extends PersonLike>(
  onChange: (state: PersonSourceState<T>) => void,
): {
  request: (request: PersonSourceRequest<T>, query: string) => void;
  retry: () => void;
  reset: () => void;
  getState: () => PersonSourceState<T>;
};
