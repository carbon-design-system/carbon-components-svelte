<script lang="ts">
  import { Button } from "carbon-components-svelte";
  import { createCopyFeedbackState } from "carbon-components-svelte/src/utils/copyFeedback.js";
  import Checkmark from "carbon-icons-svelte/lib/Checkmark.svelte";
  import Copy from "carbon-icons-svelte/lib/Copy.svelte";
  import { onMount } from "svelte";
  import {
    copyComponentMarkdown,
    formatCopyIconDescription,
  } from "../copy-markdown";

  /** Component name, used as the cache key. */
  export let name: string;
  /** URL to the component's Markdown document. */
  export let href: string;
  /** Markdown size in bytes; shown as size/token estimate in the tooltip. */
  export let bytes = 0;
  export let size: "default" | "field" | "small" | "lg" | "xl" = "field";
  export let tooltipPosition: "top" | "right" | "bottom" | "left" = "bottom";
  /** Portalled tooltips avoid clipping and support multi-line copy labels. */
  export let portalTooltip = true;

  let copied = false;
  let copying = false;
  let buttonRef: HTMLButtonElement | null = null;

  const copyFeedback = createCopyFeedbackState(() => {
    const wasCopied = copied;
    copied = copyFeedback.feedbackOpen;
    copying = copyFeedback.copyPending;
    if (wasCopied && !copied) buttonRef?.blur();
  });

  async function copyMarkdown() {
    await copyFeedback.onClick(
      async () => {
        const ok = await copyComponentMarkdown(name, href);
        if (!ok) throw new Error("Failed to copy markdown");
      },
      2000,
      portalTooltip,
    );
  }

  onMount(() => copyFeedback.cleanup);
</script>

<Button
  bind:ref={buttonRef}
  class="copy-markdown-btn"
  kind="ghost"
  {size}
  {portalTooltip}
  {tooltipPosition}
  icon={copied ? Checkmark : Copy}
  iconDescription={formatCopyIconDescription(copied, bytes)}
  disabled={copying}
  on:click={copyMarkdown}
/>

<style>
  /* iconDescription embeds a newline (size/token estimate on its own line). */
  :global(.copy-markdown-btn.bx--tooltip__trigger .bx--assistive-text) {
    display: block;
    white-space: pre-line;
    text-align: center;
  }

  :global(
    [data-floating-portal]
      .bx--tooltip-portal[data-tooltip-type="icon"]
      .bx--tooltip-portal__content
  ) {
    display: block;
    white-space: pre-line;
    text-align: center;
  }
</style>
