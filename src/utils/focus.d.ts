/**
 * Resolve initial dialog focus: `selectorPrimaryFocus`, then the first form
 * input, then the first truthy `fallbacks` entry. Returns `null` when
 * `selectorPrimaryFocus` is null or no target is found.
 */
export function initialFocus(options: {
  /** Dialog container to search within. */
  container: Element | null | undefined;
  /** Selector for the preferred focus target; `null` to focus nothing. */
  selectorPrimaryFocus?: string | null;
  /** Fallback elements if no selector or input matches. */
  fallbacks?: Array<Element | null | undefined>;
}): HTMLElement | null;

/**
 * Save focus before an overlay opens and restore it on close when the element
 * is still connected.
 */
export function restoreFocus(): {
  save(): void;
  restore(): void;
};
