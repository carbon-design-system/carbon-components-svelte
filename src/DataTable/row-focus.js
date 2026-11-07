// @ts-check
import { focusQuietly } from "../utils/focus.js";
import { selectorTabbable } from "../utils/trap-focus.js";

const ROW = "tr[data-row]";

/** @param {Element} row */
function tabbablesIn(row) {
  return /** @type {HTMLElement[]} */ (
    Array.from(row.querySelectorAll(selectorTabbable))
  ).filter((el) => el.checkVisibility?.() !== false);
}

/**
 * Svelte action for a table body: when the row that holds focus is removed
 * (a row action that deletes its own row), move focus to the same control
 * in the next row, or the previous row if it was the last. Without it the
 * browser drops focus to `<body>` and keyboard users lose their place.
 *
 * Does nothing when focus was not inside a row, or when the app has moved
 * focus elsewhere by the time the row is gone.
 *
 * @param {HTMLElement} tbody
 * @param {{ enabled?: boolean }} [options]
 * @returns {{ update: (options?: { enabled?: boolean }) => void; destroy: () => void }}
 */
export function keepRowFocus(tbody, options = {}) {
  let enabled = options.enabled !== false;
  /** @type {{ row: Element, control: HTMLElement, rows: Element[], slot: number } | null} */
  let state = null;

  /** @param {FocusEvent} event */
  function onFocusIn(event) {
    const control = event.target;
    const row = control instanceof HTMLElement ? control.closest(ROW) : null;
    if (!row || row.parentElement !== tbody) {
      state = null;
      return;
    }
    state = {
      row,
      control: /** @type {HTMLElement} */ (control),
      rows: Array.from(tbody.children).filter((el) => el.matches(ROW)),
      slot: tabbablesIn(row).indexOf(/** @type {HTMLElement} */ (control)),
    };
  }

  /** @param {FocusEvent} event */
  function onFocusOut(event) {
    if (event.relatedTarget instanceof Node) {
      // Another control takes focus and reports its own `focusin`.
      if (!tbody.contains(event.relatedTarget)) state = null;
      return;
    }
    // Focus fell to nothing: the node was removed, or the user clicked away.
    // A node that is still in the page but no longer focused is the click.
    queueMicrotask(() => {
      if (
        state?.control.isConnected &&
        document.activeElement !== state.control
      ) {
        state = null;
      }
    });
  }

  const observer =
    typeof MutationObserver === "undefined"
      ? null
      : new MutationObserver(() => {
          const current = state;
          if (!current || !enabled || current.row.isConnected) return;
          const active = document.activeElement;
          if (active && active !== document.body) return;
          state = null;
          const index = current.rows.indexOf(current.row);
          const neighbors = [
            ...current.rows.slice(index + 1),
            ...current.rows.slice(0, index).reverse(),
          ];
          for (const row of neighbors) {
            const controls = tabbablesIn(row);
            if (controls.length === 0) continue;
            const slot = Math.min(
              Math.max(current.slot, 0),
              controls.length - 1,
            );
            focusQuietly(controls[slot]);
            return;
          }
        });

  tbody.addEventListener("focusin", onFocusIn);
  tbody.addEventListener("focusout", onFocusOut);
  observer?.observe(tbody, { childList: true });

  return {
    update(next = {}) {
      enabled = next.enabled !== false;
    },
    destroy() {
      observer?.disconnect();
      tbody.removeEventListener("focusin", onFocusIn);
      tbody.removeEventListener("focusout", onFocusOut);
      state = null;
    },
  };
}
