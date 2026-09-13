// @ts-check

/**
 * Copy `text` via a hidden textarea and `document.execCommand("copy")`.
 * Used when `navigator.clipboard.writeText` is unavailable or rejects
 * (for example in an insecure context).
 * @param {string} text
 * @returns {void}
 */
function copyTextWithExecCommand(text) {
  if (typeof document.execCommand !== "function") {
    throw new Error("Failed to copy");
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "0";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    const ok = document.execCommand("copy");
    if (!ok) {
      throw new Error("Failed to copy");
    }
  } finally {
    document.body.removeChild(textarea);
  }
}

/**
 * Copy text to the clipboard.
 *
 * Tries `navigator.clipboard.writeText` first, then falls back to a
 * textarea + `document.execCommand("copy")` path. Rejects if both fail.
 *
 * @param {string} text
 * @returns {Promise<void>}
 */
export async function copyText(text) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall through to execCommand (insecure contexts, permission denied, etc.).
    }
  }

  copyTextWithExecCommand(text);
}
