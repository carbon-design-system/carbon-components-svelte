type MaybeElement = Element | null | undefined;
type ElementSource = MaybeElement | (() => MaybeElement);

export type OverlayTrigger = "escape-key" | "outside-click" | "tab";

/**
 * How a click outside the layer treats it: `"dismiss"` calls `onDismiss`,
 * `"block"` stops the walk down the stack without dismissing, `"ignore"`
 * passes over it (a tooltip).
 */
export type OverlayOutside = "dismiss" | "block" | "ignore";

/**
 * What Escape does to the layer: `true` dismisses it and ends the search,
 * `false` skips it, `"pass"` dismisses it and lets the key go on to the next
 * layer, `"native"` ends the search and leaves the key to the browser.
 */
export type OverlayEscape = boolean | "pass" | "native";

export interface OverlayOptions {
  /** The layer's surface. Clicks inside it are not outside clicks. */
  element?: ElementSource;
  /** A larger box that belongs to the layer, such as a modal's full-screen root. */
  backdrop?: ElementSource;
  /** Elements, such as the trigger, that count as inside. */
  anchors?: ElementSource | Array<MaybeElement> | (() => Array<MaybeElement>);
  /** Extra test for "inside". */
  contains?: (target: Node) => boolean;
  /** A label for debugging and tests. */
  kind?: string;
  /** The page behind is `inert` and body scroll is locked. */
  modal?: boolean;
  /**
   * The layer is in the browser's top layer (`dialog.showModal()`): the
   * browser makes the page behind inert, and Escape is left to the browser.
   */
  native?: boolean;
  /** Lock body scroll while open. Default: the value of `modal`, unless `native`. */
  scrollLock?: boolean;
  /**
   * Leave a key a widget inside already used (`preventDefault`) alone.
   * Default `false`.
   */
  respectHandled?: boolean;
  /**
   * Take Escape in the capture phase, before any widget inside the layer
   * sees it. For a tooltip.
   */
  capture?: boolean;
  /** Trap Tab in `element` while this is the top layer. */
  trap?: boolean | (() => boolean);
  /** Tab dismisses the layer (a menu), with the trigger `"tab"`. */
  closeOnTab?: boolean | (() => boolean);
  /** Close the layer. The caller flips its own `open`. */
  onDismiss(trigger: OverlayTrigger, event: Event): void;
  /** Default `true`. */
  escape?: OverlayEscape | ((event?: KeyboardEvent) => OverlayEscape);
  /** Default `"dismiss"`, or `"block"` for a modal. */
  outside?: OverlayOutside | (() => OverlayOutside);
  /** Called for a click outside, before `onDismiss`. */
  onOutsidePress?(event: Event): void;
  /**
   * Called with `true` when a modal opens above this layer, and with `false`
   * when it no longer is below one. The layer's own `inert` follows it.
   */
  onCovered?(covered: boolean): void;
  /** The element a live region for this layer belongs in. Default `element`. */
  host?: ElementSource;
  /**
   * When the layer closes with focus inside it, move focus back to the
   * element focused when it opened.
   */
  returnFocus?: boolean;
  /** Where `restoreFocus` goes when the element focused at open time is gone. */
  returnFocusTo?: ElementSource;
  /** What takes focus when this layer is the fallback for one above it. */
  focusTarget?: ElementSource;
}

/** Params for the `overlay` action: the options and whether the layer is open. */
export type OverlayParams = OverlayOptions & { enabled: boolean };

export interface OverlayController {
  open(): void;
  close(): void;
  /** Open or close to match `next`. */
  sync(next: boolean): void;
  update(patch: Partial<OverlayOptions>): void;
  isOpen(): boolean;
  isTop(): boolean;
  hasLayerAbove(): boolean;
  escape(event: KeyboardEvent): boolean;
  restoreFocus(region?: Element | null): void;
}

/** Give Escape to the layer that should take it. */
export function routeEscape(
  event: KeyboardEvent,
  phase?: "capture" | "bubble",
): boolean;

/** The element a live region should live in: the top modal's. */
export function getModalHost(): Element | null;

/** Called when the top modal's host changes. Returns an unsubscribe function. */
export function subscribeModalHost(
  listener: (host: Element | null) => void,
): () => void;

export function getOverlays(): Array<{
  id: number;
  kind: string | undefined;
  modal: boolean;
}>;

export function resetOverlays(): void;

export function createOverlay(options: OverlayOptions): OverlayController;

/** Svelte action: a layer while `enabled`, on `node` unless `element` is set. */
export function overlay(
  node: Element,
  params: OverlayParams,
): {
  update: (params: OverlayParams) => void;
  destroy: () => void;
};
