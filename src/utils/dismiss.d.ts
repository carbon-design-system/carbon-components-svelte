/** A single window listener managed by the `dismiss` action. */
export interface DismissListener {
  type: string;
  handler: (event: Event) => void;
  options?: boolean | AddEventListenerOptions;
}

/** Params for `dismiss`. Use `listeners` or the `type` + `handler` shorthand. */
export interface DismissParams {
  enabled: boolean;
  listeners?: DismissListener[];
  type?: string | string[];
  handler?: (event: Event) => void;
  options?: boolean | AddEventListenerOptions;
}

/** Adds `window` listeners only while `enabled` is true. SSR-safe. */
export function dismiss(
  node: unknown,
  params: DismissParams,
): { update: (params: DismissParams) => void; destroy: () => void };
