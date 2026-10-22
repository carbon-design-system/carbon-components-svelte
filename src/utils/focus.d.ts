export function initialFocus(options: {
  container: Element | null | undefined;
  selectorPrimaryFocus?: string | null;
  fallbacks?: Array<Element | null | undefined>;
}): HTMLElement | null;

export type FocusFallback =
  | HTMLElement
  | null
  | undefined
  | (() => HTMLElement | null | undefined);

export function restoreFocus(): {
  save(): void;
  restore(region?: Element | null, fallback?: FocusFallback): void;
};

export function returnFocus(
  target: HTMLElement | null | undefined,
  region?: Element | null,
): void;

export function returnFocusOnClose(
  getTrigger: () => HTMLElement | null | undefined,
  getPanel: () => Element | null | undefined,
): (open: boolean) => void;
