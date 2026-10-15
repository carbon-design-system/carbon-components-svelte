export function getActiveElement(node: Node | null | undefined): Element | null;

export function getFocusedElement(): Element | null;

export function initialFocus(options: {
  container: Element | null | undefined;
  selectorPrimaryFocus?: string | null;
  fallbacks?: Array<Element | null | undefined>;
}): HTMLElement | null;

export function restoreFocus(): {
  save(): void;
  restore(region?: Element | null): void;
};

export function returnFocus(
  target: HTMLElement | null | undefined,
  region?: Element | null,
): void;

export function returnFocusOnClose(
  getTrigger: () => HTMLElement | null | undefined,
  getPanel: () => Element | null | undefined,
): (open: boolean) => void;
