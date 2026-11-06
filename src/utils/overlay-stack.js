// @ts-check
import {
  acquireBodyScrollLock,
  releaseBodyScrollLock,
} from "./body-scroll-lock.js";
import { focusIsFree, focusQuietly, getPressTarget } from "./focus.js";
import { isImeComposition } from "./ime-composition.js";
import { selectorTabbable, trapFocus } from "./trap-focus.js";
import { addPooledListener } from "./window-listener-pool.js";

/**
 * One stack of open overlays for the page. It decides which layer gets Escape
 * and outside clicks, traps Tab in the top modal, makes the page behind a
 * modal `inert`, locks body scroll (ref-counted), and returns focus to the
 * trigger, or to a fallback when the trigger is gone.
 *
 * Rules:
 * - Layers stack in the order they open. The top layer takes Escape; a layer
 *   with `escape: false` is skipped, one with `"pass"` is dismissed and the
 *   key goes on to the next layer, one with `"native"` stops the search and
 *   leaves the key to the browser (a `<dialog>` closes itself).
 * - A click lands on the highest layer that holds the click (or the press
 *   that began it). Every layer above it is dismissed, top down, until one
 *   that does not dismiss (`outside: "block"`) stops the walk. A layer with
 *   `outside: "ignore"` (a tooltip) is passed over.
 * - A layer opened by an event is not dismissed by that event (the click
 *   that opens it is still on its way to `window`), but takes the next.
 * - Widgets inside a layer get the key first (it bubbles), and stop it when
 *   they use it. The stack listens on `window`, in the bubble phase, with
 *   pooled listeners that exist only while a layer is open.
 *
 * Every function is a no-op on the server.
 */

/**
 * @typedef {Element | null | undefined} MaybeElement
 * @typedef {MaybeElement | (() => MaybeElement)} ElementSource
 * @typedef {"escape-key" | "outside-click" | "tab"} OverlayTrigger
 * @typedef {"dismiss" | "block" | "ignore"} OverlayOutside
 * @typedef {boolean | "pass" | "native"} OverlayEscape
 *
 * @typedef {object} OverlayOptions
 * @property {ElementSource} [element] The layer's surface. Clicks inside it
 *   are not outside clicks, and the top modal's Tab is trapped in it.
 * @property {ElementSource} [backdrop] A larger box that belongs to the layer,
 *   such as a modal's full-screen root. A click on it lands on this layer.
 * @property {ElementSource | Array<MaybeElement>} [anchors] Elements, such as
 *   the trigger, that count as inside.
 * @property {(target: Node) => boolean} [contains] Extra test for "inside".
 * @property {string} [kind] A label for debugging and tests.
 * @property {boolean} [modal] The page behind is `inert` and body scroll is
 *   locked. Default `false`.
 * @property {boolean} [native] The layer is in the browser's top layer
 *   (`dialog.showModal()`): the browser makes the page behind inert, so the
 *   stack does not, and Escape is left to the browser.
 * @property {boolean} [scrollLock] Lock body scroll while open. Default: the
 *   value of `modal`, unless `native`.
 * @property {boolean} [respectHandled] Leave a key a widget inside already
 *   used (`preventDefault`) alone. Default `false`: `Search` clears on Escape
 *   with `preventDefault` and a `Modal` around it still closes.
 * @property {boolean} [capture] Take Escape in the capture phase, before any
 *   widget inside the layer sees it. For a tooltip. Default `false`.
 * @property {boolean | (() => boolean)} [trap] Trap Tab in `element` while
 *   this is the top layer. Default `false`.
 * @property {boolean | (() => boolean)} [closeOnTab] Tab dismisses the layer
 *   (a menu), with the trigger `"tab"`, instead of moving focus on. Default
 *   `false`.
 * @property {(trigger: OverlayTrigger, event: Event) => void} onDismiss Close
 *   the layer. The caller flips its own `open`.
 * @property {OverlayEscape | ((event?: KeyboardEvent) => OverlayEscape)} [escape]
 *   Default `true`. A function sees the key.
 * @property {OverlayOutside | (() => OverlayOutside)} [outside] Default
 *   `"dismiss"` for a layer that is not modal, `"block"` for one that is.
 * @property {(event: Event) => void} [onOutsidePress] Called for a click
 *   outside the layer that reaches it, before `onDismiss`.
 * @property {(covered: boolean) => void} [onCovered] Called with `true` when
 *   a modal opens above this layer, and with `false` when it no longer is
 *   below one. The layer's own `inert` follows it, instead of the stack
 *   writing the attribute to an element the component also writes.
 * @property {ElementSource} [host] The element a live region for this layer
 *   belongs in. Default `element`.
 * @property {boolean} [returnFocus] When the layer closes with focus inside
 *   it, move focus back to the element focused when it opened. For a layer
 *   that has no close handler of its own to do that. Default `false`.
 * @property {ElementSource} [returnFocusTo] Where `restoreFocus` goes when the
 *   element focused at open time is gone.
 * @property {ElementSource} [focusTarget] What takes focus when this layer is
 *   the fallback for one above it. Default `element`.
 *
 * @typedef {OverlayOptions & { enabled: boolean }} OverlayParams
 *
 * @typedef {object} Layer
 * @property {number} id
 * @property {OverlayOptions} options
 * @property {Event | null} born The event in flight when it opened, which
 *   it ignores.
 * @property {boolean} covered A modal is open above it.
 * @property {boolean} locked
 * @property {boolean} removed
 */

/** @type {Layer[]} Bottom to top. */
let layers = [];
let nextId = 1;

/** Where the press that began the current click landed. @type {{ target: EventTarget | null, path: EventTarget[] } | null} */
let press = null;
/**
 * Per key: the layers already dismissed by it, and whether one took it. Lets
 * the capture and bubble passes, and a layer's own handler, share one key.
 * @type {WeakMap<Event, { done: Set<Layer>, taken: boolean }>}
 */
const routed = new WeakMap();

/** Elements this module made `inert`. @type {Set<Element>} */
const inerted = new Set();

/** @type {Set<(host: Element | null) => void>} */
const hostListeners = new Set();
/** @type {Element | null} */
let lastHost = null;

let flushQueued = false;

/**
 * @template T
 * @param {T | (() => T)} value
 * @returns {T}
 */
function read(value) {
  return typeof value === "function" ? /** @type {() => T} */ (value)() : value;
}

/**
 * @param {ElementSource} source
 * @returns {Element | null}
 */
function resolve(source) {
  return (typeof source === "function" ? source() : source) ?? null;
}

/**
 * @param {Layer} layer
 * @returns {Element | null}
 */
function surface(layer) {
  return resolve(layer.options.element);
}

/**
 * @param {Layer} layer
 * @param {KeyboardEvent} [event]
 * @returns {OverlayEscape}
 */
function escapeOf(layer, event) {
  const { escape = true } = layer.options;
  return typeof escape === "function" ? escape(event) : escape;
}

/**
 * @param {Layer} layer
 * @returns {OverlayOutside}
 */
function outsideOf(layer) {
  const { outside, modal } = layer.options;
  return read(outside ?? (modal ? "block" : "dismiss"));
}

/**
 * @param {Layer} layer
 * @param {EventTarget | null} target
 * @param {EventTarget[]} path
 * @returns {boolean}
 */
function holds(layer, target, path) {
  const { options } = layer;
  const anchors = read(options.anchors);
  const roots = [
    resolve(options.backdrop) ?? resolve(options.element),
    ...(Array.isArray(anchors) ? anchors : [anchors]),
  ];
  for (const root of roots) {
    if (!root) continue;
    if (target instanceof Node && root.contains(target)) return true;
    if (path.includes(root)) return true;
  }
  return !!(
    target instanceof Node &&
    options.contains &&
    options.contains(target)
  );
}

/** @param {Event} event */
function onPointerDown(event) {
  if (layers.length === 0) {
    press = null;
    return;
  }
  press = {
    target: event.target,
    path: typeof event.composedPath === "function" ? event.composedPath() : [],
  };
}

/** @param {MouseEvent} event */
function onClick(event) {
  const started = press;
  press = null;
  if (layers.length === 0) return;
  const path =
    typeof event.composedPath === "function" ? event.composedPath() : [];

  // The highest layer the click, or the press that began it, landed on.
  let landed = -1;
  for (let i = layers.length - 1; i >= 0; i--) {
    const layer = layers[i];
    if (
      holds(layer, event.target, path) ||
      (started && holds(layer, started.target, started.path))
    ) {
      landed = i;
      break;
    }
  }

  const above = layers.slice(landed + 1).reverse();
  for (const layer of above) {
    if (layer.removed || layer.born === event) continue;
    const mode = outsideOf(layer);
    layer.options.onOutsidePress?.(event);
    if (mode === "ignore") continue;
    if (mode === "block") break;
    layer.options.onDismiss("outside-click", event);
  }
}

/**
 * Give Escape to the layer that should take it. Returns `true` when a layer
 * took it and the event was stopped. Safe to call from a layer's own keydown
 * handler and from the window listeners: a layer is dismissed once per key.
 *
 * The layer that takes the key is the top one that does not skip it. A layer
 * with `capture` takes it in the capture phase, before any widget inside it
 * (a tooltip hides before the field under it acts on Escape). Every other
 * layer takes it in the bubble phase, after the widgets inside have had it.
 *
 * @param {KeyboardEvent} event
 * @param {"capture" | "bubble"} [phase]
 * @returns {boolean}
 */
export function routeEscape(event, phase = "bubble") {
  if (event.key !== "Escape" || layers.length === 0) return false;
  let state = routed.get(event);
  if (state?.taken) return true;
  // A key that cancels an IME composition is not a dismissal.
  if (isImeComposition(event)) return false;
  if (!state) {
    state = { done: new Set(), taken: false };
    routed.set(event, state);
  }

  for (const layer of [...layers].reverse()) {
    if (layer.removed || state.done.has(layer)) continue;
    const mode = escapeOf(layer, event);
    if (mode === false) continue;
    if (mode === "native") {
      // The browser has closed a dialog before its `close` event has taken the
      // layer off the stack: the key is for the layer below.
      const element = surface(layer);
      if (element instanceof HTMLDialogElement && !element.open) continue;
      break;
    }
    // A widget inside already used this key (`preventDefault`).
    if (event.defaultPrevented && layer.options.respectHandled) break;
    // The top layer decides, and it is not due until its own phase.
    if (!!layer.options.capture !== (phase === "capture")) break;
    state.done.add(layer);
    layer.options.onDismiss("escape-key", event);
    if (mode === "pass") continue;
    state.taken = true;
    event.stopPropagation();
    event.preventDefault();
    break;
  }
  return state.taken;
}

/** @param {KeyboardEvent} event */
function onKeydownCapture(event) {
  if (layers.length > 0 && event.key === "Escape") {
    routeEscape(event, "capture");
  }
}

/** @param {KeyboardEvent} event */
function onKeydown(event) {
  if (layers.length === 0) return;
  if (event.key === "Escape") {
    routeEscape(event);
  } else if (event.key === "Tab" && !event.defaultPrevented) {
    // The topmost layer that closes on Tab (a menu), else the topmost that
    // traps. A tooltip or menu above a modal does not lift the trap.
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      if (!read(layer.options.closeOnTab)) continue;
      event.preventDefault();
      layer.options.onDismiss("tab", event);
      return;
    }
    for (let i = layers.length - 1; i >= 0; i--) {
      if (!read(layers[i].options.trap)) continue;
      const container = surface(layers[i]);
      if (container?.contains(document.activeElement)) {
        trapFocus({ container, event });
      }
      return;
    }
  }
}

/**
 * Pooled window listeners, each held only while a layer needs it: the capture
 * `keydown` for layers that take Escape first, the bubble `keydown` for the
 * rest (and for Tab), and the clicks for layers that react to them.
 * @type {Record<string, (() => void) | null>}
 */
const listeners = { capture: null, bubble: null, click: null };

/**
 * @param {string} name
 * @param {boolean} wanted
 * @param {() => () => void} add
 */
function hold(name, wanted, add) {
  if (wanted && !listeners[name]) listeners[name] = add();
  else if (!wanted && listeners[name]) {
    /** @type {() => void} */ (listeners[name])();
    listeners[name] = null;
  }
}

/** Add or drop the window listeners to match the layers. */
function refreshListeners() {
  if (typeof window === "undefined") return;
  hold(
    "capture",
    layers.some((layer) => layer.options.capture),
    () =>
      addPooledListener(
        "keydown",
        (event) => onKeydownCapture(/** @type {KeyboardEvent} */ (event)),
        true,
      ),
  );
  hold(
    "bubble",
    layers.some((layer) => !layer.options.capture),
    () =>
      addPooledListener("keydown", (event) =>
        onKeydown(/** @type {KeyboardEvent} */ (event)),
      ),
  );
  hold(
    "click",
    layers.some(
      (layer) => outsideOf(layer) !== "ignore" || layer.options.onOutsidePress,
    ),
    () => {
      const removers = [
        addPooledListener("click", (event) =>
          onClick(/** @type {MouseEvent} */ (event)),
        ),
        addPooledListener("pointerdown", onPointerDown, true),
      ];
      return () => {
        for (const remove of removers) remove();
        press = null;
      };
    },
  );
}

const NON_CONTENT = /^(SCRIPT|STYLE|LINK|TEMPLATE|NOSCRIPT)$/;

const WHITESPACE = /\s+/;
const REFERENCES = ["aria-labelledby", "aria-describedby", "aria-details"];

/**
 * The elements a dialog names or describes itself with.
 * @param {Element} dialog
 * @returns {Element[]}
 */
function referencedBy(dialog) {
  /** @type {Element[]} */
  const found = [];
  for (const attribute of REFERENCES) {
    for (const id of (dialog.getAttribute(attribute) ?? "").split(WHITESPACE)) {
      const target = id ? document.getElementById(id) : null;
      if (target && !dialog.contains(target)) found.push(target);
    }
  }
  return found;
}

/**
 * @param {Element} element
 * @param {Set<Element>} keep
 */
function keepWithPath(element, keep) {
  for (
    let node = /** @type {Element | null} */ (element);
    node;
    node = node.parentElement
  ) {
    keep.add(node);
  }
}

/**
 * Elements the stack leaves alone: portal hosts, which hold the menus and
 * tooltips of the open layers; roots that set their own `inert` from
 * `onCovered` and `open` (`Modal`, `SidePanel`), so a closed one keeps it; and
 * non-content nodes.
 * @param {Element} element
 * @returns {boolean}
 */
function exemptFromInert(element) {
  return (
    element.hasAttribute("data-portal") ||
    element.hasAttribute("data-overlay-exempt") ||
    element.hasAttribute("data-overlay-managed") ||
    NON_CONTENT.test(element.tagName)
  );
}

/**
 * @param {Element} parent
 * @param {Set<Element>} keep Each layer's element and the elements around it.
 * @param {Set<Element>} roots The layers' elements: all of each stays live.
 * @param {Set<Element>} managed Elements of layers that follow `onCovered`.
 * @param {Set<Element>} want
 */
function collectInert(parent, keep, roots, managed, want) {
  for (const child of Array.from(parent.children)) {
    if (roots.has(child)) continue;
    if (keep.has(child)) {
      collectInert(child, keep, roots, managed, want);
    } else if (managed.has(child)) {
      continue;
    } else if (!exemptFromInert(child)) {
      // Leave an element that is `inert` for its own reasons (a closed
      // `Modal`) to the component that owns it.
      if (child.hasAttribute("inert") && !inerted.has(child)) continue;
      want.add(child);
    }
  }
}

/**
 * Tell each layer with `onCovered` whether a modal is open above it. A layer
 * that holds the top modal in its DOM is not covered; the modal's own branch
 * is left live.
 * @param {number} modalIndex
 */
function cover(modalIndex) {
  const top = modalIndex >= 0 ? surface(layers[modalIndex]) : null;
  layers.forEach((layer, index) => {
    const { onCovered } = layer.options;
    if (!onCovered) return;
    const element = surface(layer);
    const covered =
      index < modalIndex && !!element && !(top && element.contains(top));
    if (covered === layer.covered) return;
    layer.covered = covered;
    onCovered(covered);
  });
}

/** Make everything outside the top modal and the layers above it `inert`. */
function applyBackground() {
  if (typeof document === "undefined") return;
  /** @type {Set<Element>} */
  const want = new Set();
  let modalIndex = -1;
  for (let i = layers.length - 1; i >= 0; i--) {
    const { modal, native } = layers[i].options;
    if (modal && !native) {
      modalIndex = i;
      break;
    }
  }
  if (modalIndex >= 0) {
    /** @type {Set<Element>} */
    const keep = new Set();
    /** @type {Set<Element>} */
    const roots = new Set();
    let complete = true;
    for (let i = modalIndex; i < layers.length; i++) {
      const element = surface(layers[i]);
      if (!element) {
        // Not bound yet. The microtask after the push tries again.
        if (i === modalIndex) complete = false;
        continue;
      }
      roots.add(element);
      keepWithPath(element, keep);
      // What names or describes the dialog stays in the accessibility tree,
      // wherever it is on the page: `inert` hides it from the name
      // computation too.
      for (const target of referencedBy(
        resolve(layers[i].options.host) ?? element,
      )) {
        roots.add(target);
        keepWithPath(target, keep);
      }
    }
    if (complete) {
      /** @type {Set<Element>} */
      const managed = new Set();
      for (const layer of layers) {
        const element = layer.options.onCovered && surface(layer);
        if (element) managed.add(element);
      }
      collectInert(document.body, keep, roots, managed, want);
    }
  }
  cover(modalIndex);
  for (const element of inerted) {
    if (!want.has(element)) {
      element.removeAttribute("inert");
      inerted.delete(element);
    }
  }
  for (const element of want) {
    if (!inerted.has(element)) {
      element.setAttribute("inert", "");
      inerted.add(element);
    }
  }
}

/** The host for live regions: the top modal's. @returns {Element | null} */
export function getModalHost() {
  for (let i = layers.length - 1; i >= 0; i--) {
    const { options } = layers[i];
    if (options.modal || options.native) {
      return resolve(options.host) ?? resolve(options.element);
    }
  }
  return null;
}

/**
 * Called when the element a live region should live in changes: the top
 * modal's element while one is open, `null` otherwise. For an announcer
 * (`pushAnnouncerHost(host)` on a host, the returned function on `null`).
 *
 * @param {(host: Element | null) => void} listener
 * @returns {() => void} Unsubscribe.
 */
export function subscribeModalHost(listener) {
  hostListeners.add(listener);
  return () => {
    hostListeners.delete(listener);
  };
}

function notifyHost() {
  if (hostListeners.size === 0) return;
  const host = getModalHost();
  if (host === lastHost) return;
  lastHost = host;
  for (const listener of [...hostListeners]) listener(host);
}

/** Apply the effects on the page, now and once more after the microtask. */
function settle() {
  const background =
    inerted.size > 0 ||
    layers.some(
      (layer) =>
        layer.covered || (layer.options.modal && !layer.options.native),
    );
  if (background) applyBackground();
  notifyHost();
  if (!background || flushQueued) return;
  flushQueued = true;
  queueMicrotask(() => {
    flushQueued = false;
    applyBackground();
    notifyHost();
  });
}

/**
 * @param {OverlayOptions} options
 * @returns {Layer}
 */
function addLayer(options) {
  /** @type {Layer} */
  const layer = {
    id: nextId++,
    options,
    // `window.event` is still the click while Svelte flushes the update that
    // opened the layer, in a microtask after the handler.
    born: typeof window === "undefined" ? null : (window.event ?? null),
    covered: false,
    locked: false,
    removed: false,
  };
  layers.push(layer);
  refreshListeners();
  syncLock(layer);
  settle();
  return layer;
}

/** Hold the scroll lock while the layer's options ask for it. @param {Layer} layer */
function syncLock(layer) {
  const { scrollLock, modal, native } = layer.options;
  const want = scrollLock ?? (!!modal && !native);
  if (want && !layer.locked) {
    layer.locked = true;
    acquireBodyScrollLock();
  } else if (!want && layer.locked) {
    layer.locked = false;
    releaseBodyScrollLock();
  }
}

/** @param {Layer} layer */
function dropLayer(layer) {
  if (layer.removed) return;
  layer.removed = true;
  layers = layers.filter((entry) => entry !== layer);
  // A layer that goes while covered would stay inert.
  if (layer.covered) {
    layer.covered = false;
    layer.options.onCovered?.(false);
  }
  if (layer.locked) releaseBodyScrollLock();
  refreshListeners();
  settle();
}

/**
 * The layers open now, bottom to top. For tests and tooling.
 * @returns {Array<{ id: number, kind: string | undefined, modal: boolean }>}
 */
export function getOverlays() {
  return layers.map((layer) => ({
    id: layer.id,
    kind: layer.options.kind,
    modal: !!layer.options.modal,
  }));
}

/** Remove every layer and every effect. For tests. */
export function resetOverlays() {
  for (const layer of [...layers]) dropLayer(layer);
  layers = [];
  refreshListeners();
  press = null;
  lastHost = null;
  for (const element of inerted) element.removeAttribute("inert");
  inerted.clear();
}

/**
 * A layer's controller. It does nothing until `sync(true)` or `open()`.
 *
 * @param {OverlayOptions} options
 */
export function createOverlay(options) {
  /** @type {Layer | null} */
  let layer = null;
  /** @type {HTMLElement | null} */
  let opener = null;
  /** What had focus when the layer opened. @type {Element | null} */
  let focusedAtOpen = null;
  /** Whether focus is yet to go back. A second call must do nothing. */
  let returnPending = false;
  let opts = options;

  /** Whether the layer is in the stack. */
  function isOpen() {
    return layer !== null && !layer.removed;
  }

  function open() {
    if (typeof document === "undefined" || isOpen()) return;
    opener = findOpener();
    focusedAtOpen = document.activeElement;
    returnPending = true;
    layer = addLayer(opts);
  }

  function close() {
    if (!layer) return;
    // Focus inside a layer that closes would fall to the body.
    const region = surface(layer);
    const held = !!(
      opts.returnFocus && region?.contains(document.activeElement)
    );
    dropLayer(layer);
    layer = null;
    if (held) setTimeout(() => restore(region));
  }

  return {
    open,
    close,
    /** Open or close to match `next`. Cheap to call on every update. @param {boolean} next */
    sync(next) {
      if (next) open();
      else close();
    },
    /** Replace options in place; the layer keeps its place in the stack. @param {Partial<OverlayOptions>} patch */
    update(patch) {
      opts = { ...opts, ...patch };
      if (layer && !layer.removed) {
        layer.options = opts;
        refreshListeners();
        syncLock(layer);
        settle();
      }
    },
    isOpen,
    /** Whether no layer opened after this one is still open. */
    isTop() {
      return !!layer && layers[layers.length - 1] === layer;
    },
    /**
     * Whether a layer opened after this one is still open and takes clicks
     * (a tooltip does not).
     */
    hasLayerAbove() {
      if (!layer || layer.removed) return false;
      const index = layers.indexOf(layer);
      return layers
        .slice(index + 1)
        .some((above) => outsideOf(above) !== "ignore");
    },
    /**
     * Route an Escape through the stack from this layer's own keydown
     * handler, so the key stops where it always did.
     * @param {KeyboardEvent} event
     */
    escape(event) {
      return routeEscape(event);
    },
    /**
     * Move focus back after the layer has closed: to the element focused when
     * it opened, else `returnFocusTo`, else the layer below. Does nothing when
     * focus has since moved somewhere outside `region`.
     * @param {Element | null} [region] The closing surface.
     */
    restoreFocus: restore,
  };

  /** @param {Element | null} [region] */
  function restore(region) {
    if (typeof document === "undefined" || !returnPending) return;
    returnPending = false;
    const target = pickReturnTarget(opener, opts);
    opener = null;
    if (!target) return;
    // Free: focus was dropped, is in the closing layer, is on something that
    // can no longer have it, or is back where the browser put it (a native
    // dialog gives focus back to what had it when it opened, which in Safari
    // is not the button that was clicked).
    if (
      region === undefined ||
      focusIsFree(region) ||
      focusIsLost() ||
      document.activeElement === focusedAtOpen
    ) {
      focusQuietly(target);
    }
  }
}

/**
 * What opened a layer: the focused control, else the control the event in
 * flight, or the last press, landed on, else whatever has focus. Safari does
 * not focus a button on click, so focus alone leaves the trigger unknown, or
 * shows the container of a dialog the button sits in.
 * @returns {HTMLElement | null}
 */
function findOpener() {
  const active = document.activeElement;
  if (active instanceof HTMLElement && active.matches(selectorTabbable)) {
    return active;
  }
  const target = window.event?.target ?? getPressTarget();
  const control =
    target instanceof Element ? target.closest(selectorTabbable) : null;
  if (control instanceof HTMLElement) return control;
  return active instanceof HTMLElement && active !== document.body
    ? active
    : null;
}

/**
 * Whether `element` can take focus now: in the document, and not inside an
 * `inert` or hidden subtree (the closed modal that held the trigger).
 * @param {Element | null} element
 * @returns {element is HTMLElement}
 */
function canFocus(element) {
  if (!(element instanceof HTMLElement) || !element.isConnected) return false;
  if (element.closest("[inert]")) return false;
  return typeof element.checkVisibility === "function"
    ? element.checkVisibility({ visibilityProperty: true })
    : true;
}

/**
 * Whether focus sits on an element that can no longer have it: one inside a
 * closed modal's `inert` or hidden subtree. The browser moves focus off it
 * at its next rendering update, so a restore that runs first sees it.
 * @returns {boolean}
 */
function focusIsLost() {
  const active = document.activeElement;
  return !!active && active !== document.body && !canFocus(active);
}

/**
 * @param {HTMLElement | null} opener
 * @param {OverlayOptions} options
 * @returns {HTMLElement | null}
 */
function pickReturnTarget(opener, options) {
  if (canFocus(opener)) return opener;
  const explicit = resolve(options.returnFocusTo);
  if (canFocus(explicit)) return explicit;
  for (let i = layers.length - 1; i >= 0; i--) {
    const below = layers[i];
    const target = resolve(below.options.focusTarget ?? below.options.element);
    if (canFocus(target)) return target;
  }
  return null;
}

/**
 * Svelte action: a layer while `enabled`, on `node` unless `element` is set.
 *
 * @param {Element} node
 * @param {OverlayParams} params
 */
export function overlay(node, params) {
  const { enabled, ...rest } = params;
  const controller = createOverlay({ element: node, ...rest });
  controller.sync(enabled);
  return {
    /** @param {OverlayParams} next */
    update(next) {
      const { enabled: nextEnabled, ...nextRest } = next;
      controller.update({ element: node, ...nextRest });
      controller.sync(nextEnabled);
    },
    destroy() {
      controller.close();
    },
  };
}
