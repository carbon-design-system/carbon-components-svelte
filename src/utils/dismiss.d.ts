/** A single window listener managed by the `dismiss` action. */
export interface DismissListener {
  type: string;
  handler: (event: Event) => void;
  options?: boolean | AddEventListenerOptions;
}

/** Params for `dismiss`. Use `listeners` or the `type` + `handler` shorthand. */
export interface DismissParams {
  enabled: boolean;
  /**
   * Register every listener as soon as `enabled` turns on, instead of
   * deferring pointer listeners a task. For drags, where the release can
   * arrive right after the press that enabled them.
   */
  immediate?: boolean;
  listeners?: DismissListener[];
  type?: string | string[];
  handler?: (event: Event) => void;
  options?: boolean | AddEventListenerOptions;
}

/** Adds `window` listeners only while `enabled` is true. SSR-safe. */
export function dismiss(
  node: unknown,
  options: DismissParams,
): { update: (options: DismissParams) => void; destroy: () => void };
