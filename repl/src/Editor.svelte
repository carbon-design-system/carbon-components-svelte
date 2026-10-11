<script>
  import Button from "carbon-components-svelte/src/Button/Button.svelte";
  import Tab from "carbon-components-svelte/src/Tabs/Tab.svelte";
  import Tabs from "carbon-components-svelte/src/Tabs/Tabs.svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
  import TrashCan from "carbon-icons-svelte/lib/TrashCan.svelte";
  import { onMount } from "svelte";
  import {
    active,
    addFile,
    compileNow,
    diagnostics,
    files,
    flushEdits,
    removeFile,
    updateSource,
  } from "./state.js";

  const LEADING_WHITESPACE = /^\s*/;
  const OPENS_BLOCK = /[{([>]\s*$/;
  const CLOSING_TAG = /<\/[\w-]+>\s*$/;

  /** @type {HTMLTextAreaElement} */
  let textarea;

  $: file = $files[$active] ?? $files[0];
  $: fileDiagnostics = $diagnostics.filter(
    (d) => d.file === file?.name || !d.file,
  );
  $: otherDiagnostics = $diagnostics.length - fileDiagnostics.length;

  onMount(() => {
    // Take over from the bootstrap <pre> (same text, same metrics).
    document.getElementById("boot-code")?.remove();
  });

  function insert(text) {
    // execCommand keeps the native undo stack intact.
    if (!document.execCommand("insertText", false, text)) {
      textarea.setRangeText(
        text,
        textarea.selectionStart,
        textarea.selectionEnd,
        "end",
      );
      updateSource($active, textarea.value);
    }
  }

  /** @param {KeyboardEvent} e */
  function onKeydown(e) {
    if (e.key === "Tab" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      insert("  ");
    } else if (e.key === "Enter" && !e.metaKey && !e.ctrlKey) {
      const before = textarea.value.slice(0, textarea.selectionStart);
      const indent = before
        .slice(before.lastIndexOf("\n") + 1)
        .match(LEADING_WHITESPACE)[0];
      const opens = OPENS_BLOCK.test(before) && !CLOSING_TAG.test(before);
      e.preventDefault();
      insert(`\n${indent}${opens ? "  " : ""}`);
    } else if (e.key === "s" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      compileNow();
    }
  }
</script>

<div class="tabs-row">
  <Tabs
    type="container"
    selected={$active}
    on:change={(e) => {
      flushEdits();
      active.set(e.detail);
    }}
  >
    {#each $files as f (f.name)}
      <Tab label={f.name} />
    {/each}
  </Tabs>
  <Button
    kind="ghost"
    size="field"
    icon={Add}
    iconDescription="Add file"
    on:click={addFile}
  />
  {#if $active > 0}
    <Button
      kind="ghost"
      size="field"
      icon={TrashCan}
      iconDescription="Delete {file?.name}"
      on:click={() => removeFile($active)}
    />
  {/if}
</div>

{#if file}
  <textarea
    bind:this={textarea}
    class="repl-code editor"
    spellcheck="false"
    autocapitalize="off"
    autocomplete="off"
    aria-label="{file.name} source"
    value={file.source}
    on:input={(e) => updateSource($active, e.currentTarget.value)}
    on:keydown={onKeydown}
  ></textarea>
{/if}

{#if fileDiagnostics.length || otherDiagnostics}
  <ul class="diagnostics" aria-label="Diagnostics">
    {#each fileDiagnostics as d, i (i)}
      <li class={d.severity}>
        <span class="where"
          >{d.file ?? ""}{d.line
            ? `:${d.line}:${(d.column ?? 0) + 1}`
            : ""}</span
        >
        <span>{d.message}</span>
      </li>
    {/each}
    {#if otherDiagnostics}
      <li class="other">{otherDiagnostics} more in other files</li>
    {/if}
  </ul>
{/if}

<style>
  .tabs-row {
    display: flex;
    align-items: stretch;
    background: var(--cds-ui-01, #f4f4f4);
    min-height: 3rem;
  }

  .tabs-row :global(.bx--tabs) {
    flex: 1;
    min-width: 0;
  }

  .editor {
    flex: 1;
    min-height: 0;
    width: 100%;
    box-sizing: border-box;
    border: 0;
    outline: 0;
    resize: none;
    background: var(--cds-field-01, #fff);
  }

  .editor:focus-visible {
    box-shadow: inset 0 0 0 2px var(--cds-focus, #0f62fe);
  }

  .diagnostics {
    max-height: 30%;
    overflow: auto;
    margin: 0;
    padding: 0.5rem 1rem;
    list-style: none;
    border-top: 1px solid var(--cds-ui-03, #e0e0e0);
    font:
      0.75rem / 1.4 "IBM Plex Mono",
      ui-monospace,
      monospace;
  }

  .diagnostics li {
    display: flex;
    gap: 0.75rem;
    padding: 0.25rem 0;
  }

  .diagnostics .error {
    color: var(--cds-support-01, #da1e28);
  }

  .diagnostics .warning {
    color: var(--cds-text-02, #525252);
  }

  .diagnostics .where {
    flex: none;
    font-weight: 600;
  }
</style>
