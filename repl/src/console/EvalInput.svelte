<script>
  /** Evaluate an expression in the preview. Enter runs, Shift+Enter adds a line, ↑/↓ walk history. */
  import ChevronRight from "carbon-icons-svelte/lib/ChevronRight.svelte";
  import { request } from "../state.js";
  import { push } from "./store.js";

  /** @type {HTMLTextAreaElement} */
  let inputRef;
  let value = "";
  /** @type {string[]} */
  let history = [];
  let cursor = -1;

  function resize() {
    inputRef.style.height = "auto";
    inputRef.style.height = `${Math.min(inputRef.scrollHeight, 160)}px`;
  }

  async function run() {
    const code = value.trim();
    if (!code) return;
    push({ kind: "command", level: "log", text: code });
    history = [code, ...history.filter((h) => h !== code)].slice(0, 100);
    cursor = -1;
    value = "";
    requestAnimationFrame(resize);
    await request({ type: "eval", code });
  }

  /** @param {KeyboardEvent} e */
  function handleKeydown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      run();
    } else if (
      e.key === "ArrowUp" &&
      !value.slice(0, inputRef.selectionStart).includes("\n")
    ) {
      if (cursor + 1 < history.length) {
        e.preventDefault();
        cursor += 1;
        value = history[cursor];
      }
    } else if (
      e.key === "ArrowDown" &&
      !value.slice(inputRef.selectionEnd).includes("\n") &&
      cursor >= 0
    ) {
      e.preventDefault();
      cursor -= 1;
      value = cursor === -1 ? "" : history[cursor];
    }
  }
</script>

<div class="eval">
  <ChevronRight size={12} aria-hidden="true" />
  <textarea
    bind:this={inputRef}
    bind:value
    rows="1"
    spellcheck="false"
    autocapitalize="off"
    autocomplete="off"
    aria-label="Evaluate in preview"
    placeholder="Evaluate an expression in the preview"
    on:input={resize}
    on:keydown={handleKeydown}
  ></textarea>
</div>

<style>
  .eval {
    display: flex;
    align-items: flex-start;
    gap: 0.375rem;
    padding: 0.375rem 0.5rem;
    border-top: 1px solid var(--cds-ui-03, #e0e0e0);
    fill: var(--cds-link-01, #0f62fe);
  }

  .eval :global(svg) {
    flex: none;
    margin-top: 0.25rem;
  }

  textarea {
    flex: 1;
    min-height: 1.25rem;
    padding: 0;
    border: 0;
    outline: 0;
    resize: none;
    font:
      0.75rem / 1.25rem "IBM Plex Mono",
      ui-monospace,
      monospace;
    background: transparent;
    color: var(--cds-text-01, #161616);
  }

  .eval:focus-within {
    box-shadow: inset 0 0 0 2px var(--cds-focus, #0f62fe);
  }
</style>
