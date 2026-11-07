// @ts-check
import { tick } from "svelte";
import { focusQuietly } from "./focus.js";
import { selectorTabbable } from "./trap-focus.js";

/**
 * @typedef {import("./focus-handoff.js").HandoffOptions} HandoffOptions
 * @typedef {import("./focus-handoff.js").HandoffInfo} HandoffInfo
 * @typedef {import("./focus-handoff.js").FocusHandoffOptions} FocusHandoffOptions
 *
 * @typedef {Object} Snapshot
 * @property {HTMLElement} item The item (a row, a tag) that holds focus.
 * @property {HTMLElement} focused The focused control inside `item`.
 * @property {Element[]} list The item and its siblings, in document order.
 * @property {number} index Where `item` sat in `list`.
 * @property {number} slot Which control of the item had focus: its position
 * among the item's tabbable descendants, or -1 for a control that is not
 * tabbable (a roving `tabindex="-1"`), or -2 when the item itself had focus.
 */

/** Whether nothing holds focus, as after the focused node left the page. */
function focusIsFree() {
  const active = document.activeElement;
  return (
    !active || active === document.body || active === document.documentElement
  );
}

/**
 * Whether `el` can take focus now: connected, not inert, not hidden.
 * @param {Element} el
 */
function isUsable(el) {
  if (!el.isConnected || el.closest("[inert]")) return false;
  // `checkVisibility` is missing in older engines and in jsdom, which has no
  // layout to ask.
  return typeof el.checkVisibility !== "function" || el.checkVisibility();
}

/**
 * @param {Element} item
 * @returns {HTMLElement[]}
 */
function tabbablesIn(item) {
  return /** @type {HTMLElement[]} */ (
    Array.from(item.querySelectorAll(selectorTabbable)).filter(isUsable)
  );
}

/**
 * @param {Element} item
 * @param {HandoffOptions["siblings"]} siblings
 * @returns {Element[]}
 */
function siblingsOf(item, siblings) {
  if (typeof siblings === "function") return Array.from(siblings());
  const parent = item.parentElement;
  if (!parent) return [item];
  const all = Array.from(parent.children);
  return typeof siblings === "string"
    ? all.filter((el) => el === item || el.matches(siblings))
    : all;
}

/**
 * @param {HTMLElement} item
 * @param {HTMLElement} focused
 * @param {HandoffOptions} options
 * @returns {Snapshot}
 */
function snapshot(item, focused, options) {
  const list = siblingsOf(item, options.siblings);
  let slot = -1;
  if (focused === item) slot = -2;
  else
    slot = Array.from(item.querySelectorAll(selectorTabbable)).indexOf(focused);
  return { item, focused, list, index: list.indexOf(item), slot };
}

/**
 * The control to focus inside a neighbouring item: the one in the same
 * position as the control that was focused (the Delete button of the next
 * row for the Delete button of this one), unless `target` says otherwise.
 *
 * @param {Element} candidate
 * @param {Snapshot} snap
 * @param {HandoffOptions} options
 * @returns {HTMLElement | null}
 */
function targetIn(candidate, snap, options) {
  const { target } = options;
  if (typeof target === "function") {
    const found = target(candidate);
    return found && isUsable(found) ? found : null;
  }
  if (typeof target === "string") {
    const found = candidate.matches(target)
      ? candidate
      : candidate.querySelector(target);
    return found instanceof HTMLElement && isUsable(found) ? found : null;
  }
  if (!(candidate instanceof HTMLElement) || !isUsable(candidate)) return null;
  if (snap.slot === -2) return candidate;
  const tabbable = tabbablesIn(candidate);
  if (tabbable.length > 0) {
    return tabbable[Math.min(Math.max(snap.slot, 0), tabbable.length - 1)];
  }
  return candidate.matches(selectorTabbable) ? candidate : null;
}

/**
 * Give a non-interactive fallback (a heading, a list container) a way to
 * take focus without joining the tab order.
 * @param {HTMLElement} el
 */
function makeFocusable(el) {
  if (!el.hasAttribute("tabindex") && !el.matches(selectorTabbable)) {
    el.setAttribute("tabindex", "-1");
  }
}

/**
 * @param {Snapshot} snap
 * @param {HandoffOptions} options
 * @param {HTMLElement | null | undefined} defaultFallback
 * @returns {boolean} Whether focus moved.
 */
function settle(snap, options, defaultFallback) {
  // Focus is somewhere real: the app moved it, or the item never lost it.
  // Either way it is not ours to take.
  if (!focusIsFree()) return false;
  const { item, focused } = snap;

  /**
   * @param {HTMLElement} el
   * @param {HandoffInfo["reason"]} reason
   */
  const land = (el, reason) => {
    makeFocusable(el);
    focusQuietly(el);
    options.announce?.({ reason, target: el, removed: item });
    return document.activeElement === el;
  };

  // A keyed move or a re-created control: the same control, found again.
  const same = options.find?.();
  if (same && isUsable(same)) return land(same, "same");
  if (focused.isConnected && item.contains(focused) && isUsable(focused)) {
    return land(focused, "same");
  }

  const { list, index } = snap;
  const order = [
    ...list.slice(index + 1).map((el) => /** @type {const} */ (["next", el])),
    ...list
      .slice(0, Math.max(index, 0))
      .reverse()
      .map((el) => /** @type {const} */ (["previous", el])),
  ];
  for (const [reason, candidate] of order) {
    if (candidate === item) continue;
    const el = targetIn(candidate, snap, options);
    if (el) return land(el, reason);
  }

  const fallback =
    typeof options.fallback === "function"
      ? options.fallback()
      : options.fallback;
  const last = fallback ?? defaultFallback;
  if (last && isUsable(last)) return land(last, "fallback");
  return false;
}

/**
 * Call right before removing the element that holds focus. Returns a
 * `restore` function to call right after: it waits for the framework's
 * update, then moves focus to a neighbour, but only if focus was inside
 * `element` to begin with and nothing else has claimed it since.
 *
 * ```js
 * const restore = captureFocusTarget(row, { siblings: ".row", fallback: list });
 * rows = rows.filter((r) => r !== removed);
 * restore();
 * ```
 *
 * The order of preference is the same control in the next item, then in
 * the previous one, then `fallback`, then the parent of `element`. It waits
 * with `tick()`, not `afterUpdate`: Svelte 5 runs `afterUpdate` before it
 * patches an `{#if}` or a keyed `{#each}`, so a restore from there sees the
 * old node still in place.
 *
 * @param {HTMLElement | null | undefined} element The element about to be
 * removed or replaced, or to move in a keyed list.
 * @param {HandoffOptions} [options]
 * @returns {() => Promise<boolean>} Resolves to whether focus moved.
 */
export function captureFocusTarget(element, options = {}) {
  const none = () => Promise.resolve(false);
  if (typeof document === "undefined" || !element) return none;
  const focused = document.activeElement;
  if (!(focused instanceof HTMLElement) || !element.contains(focused)) {
    return none;
  }
  const snap = snapshot(element, focused, options);
  const parent = element.parentElement;
  return async () => {
    await tick();
    return settle(snap, options, parent);
  };
}

/**
 * Svelte action: keep focus when the focused item inside `container` is
 * removed or moved by the app. Watches the DOM, so it does not matter which
 * code removed the node or when the framework patched it.
 *
 * It only acts when focus was inside the container just before the change.
 * An item removed while focus is elsewhere is left alone.
 *
 * Content removed with the container itself (a closed panel) is not seen:
 * the container is already gone. Use `captureFocusTarget` for that.
 *
 * @param {HTMLElement} container
 * @param {FocusHandoffOptions} [options]
 * @returns {{ update: (options?: FocusHandoffOptions) => void; destroy: () => void }}
 */
export function focusHandoff(container, options = {}) {
  let opts = options;
  /** @type {Snapshot | null} */
  let state = null;

  /** @param {HTMLElement} node */
  function itemOf(node) {
    if (opts.items) {
      const item = node.closest(opts.items);
      return item instanceof HTMLElement &&
        container.contains(item) &&
        item !== container
        ? item
        : null;
    }
    /** @type {HTMLElement | null} */
    let current = node;
    while (current && current.parentElement !== container) {
      current = current.parentElement;
    }
    return current;
  }

  /** @param {FocusEvent} event */
  function onFocusIn(event) {
    const node = event.target;
    if (!(node instanceof HTMLElement) || opts.enabled === false) return;
    const item = itemOf(node);
    if (!item) {
      state = null;
      return;
    }
    // Moving focus between controls of one item keeps the sibling list.
    if (state?.item === item) {
      state = { ...state, focused: node, slot: slotIn(item, node) };
      return;
    }
    state = snapshot(item, node, {
      ...opts,
      siblings: opts.items ?? opts.siblings,
    });
  }

  /**
   * @param {HTMLElement} item
   * @param {HTMLElement} node
   */
  function slotIn(item, node) {
    return node === item
      ? -2
      : Array.from(item.querySelectorAll(selectorTabbable)).indexOf(node);
  }

  /** @param {FocusEvent} event */
  function onFocusOut(event) {
    const to = event.relatedTarget;
    if (to instanceof Node) {
      // Another item will report its own `focusin`; anywhere else, focus left.
      if (!container.contains(to)) state = null;
      return;
    }
    // Focus fell to nothing: the node was removed, or the user clicked away,
    // or the window lost focus. Only a node that is still focused when the
    // dust settles is the window case. A node that is gone is a removal and
    // keeps its state for the observer. A node still in the page that no
    // longer holds focus is a blur, and ends the hand-off.
    queueMicrotask(() => {
      const s = state;
      if (s?.focused.isConnected && document.activeElement !== s.focused) {
        state = null;
      }
    });
  }

  const observer =
    typeof MutationObserver === "undefined"
      ? null
      : new MutationObserver(() => {
          const s = state;
          if (!s || opts.enabled === false || !focusIsFree()) return;
          state = null;
          settle(s, opts, container);
        });

  container.addEventListener("focusin", onFocusIn);
  container.addEventListener("focusout", onFocusOut);
  observer?.observe(container, {
    childList: true,
    subtree: opts.subtree !== false,
  });

  return {
    update(next = {}) {
      opts = next;
    },
    destroy() {
      observer?.disconnect();
      container.removeEventListener("focusin", onFocusIn);
      container.removeEventListener("focusout", onFocusOut);
      state = null;
    },
  };
}
