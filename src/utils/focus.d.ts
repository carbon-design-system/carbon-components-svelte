export function initialFocus(options: {
  container: Element | null | undefined;
  selectorPrimaryFocus?: string | null;
  fallbacks?: Array<Element | null | undefined>;
}): HTMLElement | null;

export function restoreFocus(): {
  save(): void;
  restore(): void;
};
