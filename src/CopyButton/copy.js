// @ts-check
import { createCopyFeedbackState } from "../utils/copy-feedback.js";
import { copyText } from "../utils/copy-text.js";

/**
 * @typedef {"idle" | "pending" | "copied" | "error"} CopyActionState
 *
 * @typedef {Object} CopyActionParams
 * @property {string} [text] Text to copy. Ignored when `getText` is set.
 * @property {() => string | Promise<string>} [getText] Resolve the text on
 *   click, for example a token fetched from an API. While it is pending the
 *   node gets `aria-busy="true"` and further clicks are ignored.
 * @property {(text: string) => void | Promise<void>} [copy] Override the
 *   clipboard write. Defaults to `copyText`.
 * @property {(text: string) => void} [onCopy] Called after a successful copy
 *   with the text that was written.
 * @property {(error: unknown) => void} [onError] Called when `getText` or
 *   the write rejects.
 * @property {(state: CopyActionState) => void} [onStateChange] Called on
 *   every transition, including back to `"idle"` after `feedbackTimeout`.
 * @property {number} [feedbackTimeout=2000] Milliseconds the node stays in
 *   the `"copied"` or `"error"` state.
 * @property {boolean} [enabled=true] Ignore clicks while `false`.
 */

/**
 * Svelte action: copies `text` (or the result of `getText`) to the
 * clipboard when the node is clicked and reflects the state on the node.
 * @param {HTMLElement} node
 * @param {CopyActionParams} [params]
 * @returns {{ update: (params?: CopyActionParams) => void; destroy: () => void }}
 */
export function copy(node, params = {}) {
  if (typeof window === "undefined") {
    return { update() {}, destroy() {} };
  }

  let current = params;
  let prevState = /** @type {CopyActionState} */ ("idle");

  function sync() {
    const state = copyFeedback.copyPending
      ? "pending"
      : copyFeedback.feedbackOpen && copyFeedback.isError
        ? "error"
        : copyFeedback.feedbackOpen
          ? "copied"
          : "idle";

    if (state === prevState) return;
    prevState = state;

    if (state === "idle") {
      delete node.dataset.copyState;
    } else {
      node.dataset.copyState = state;
    }

    if (state === "pending") {
      node.setAttribute("aria-busy", "true");
    } else {
      node.removeAttribute("aria-busy");
    }

    current.onStateChange?.(state);
  }

  const copyFeedback = createCopyFeedbackState(sync);

  async function handleClick() {
    const { enabled = true, text, getText, copy: copyOverride } = current;

    if (!enabled || (text === undefined && !getText)) return;

    let copiedText = "";

    try {
      await copyFeedback.onClick(
        async () => {
          const value = getText
            ? await getText()
            : /** @type {string} */ (text);
          await (copyOverride ?? copyText)(value);
          copiedText = value;
        },
        current.feedbackTimeout ?? 2000,
        true,
      );
    } catch (error) {
      current.onError?.(error);
      return;
    }

    current.onCopy?.(copiedText);
  }

  node.addEventListener("click", handleClick);

  return {
    update(next = {}) {
      current = next;
      if (next.enabled === false && prevState !== "idle") {
        copyFeedback.dismiss();
      }
    },
    destroy() {
      node.removeEventListener("click", handleClick);
      copyFeedback.cleanup();
      delete node.dataset.copyState;
      node.removeAttribute("aria-busy");
    },
  };
}
