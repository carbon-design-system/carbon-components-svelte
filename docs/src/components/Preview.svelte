<script lang="ts">
  export let code = "";
  export let codeRaw = "";
  export let src = "";
  export let framed = false;

  import { url } from "@roxi/routify";
  import { Button, CodeSnippet, Stack } from "carbon-components-svelte";
  import Launch from "carbon-icons-svelte/lib/Launch.svelte";
  import copy from "clipboard-copy";
  import { theme } from "../store";

  $: resolvedSrc = src ? $url(src) : "";
  $: themedSrcUrl = resolvedSrc ? `${resolvedSrc}?theme=${$theme}` : "";
</script>

<div class="preview">
  {#if framed}
    <div class="framed-header">
      <Stack
        orientation="horizontal"
        gap={2}
        align="center"
        style="margin-left: auto;"
      >
        <div
          class="iframe-label bx--type-label-01 bx--type-text-secondary"
          aria-hidden="true"
          style="user-select: none"
        >
          Isolated preview
        </div>
        <Button
          kind="ghost"
          target="_blank"
          size="small"
          href={resolvedSrc}
          icon={Launch}
          iconDescription="New tab"
          tooltipPosition="top"
          tooltipAlignment="end"
        > </Button>
      </Stack>
    </div>
  {/if}
  <div class="preview-viewer" class:framed>
    {#if framed}
      <iframe
        loading="lazy"
        title={src.split("/").pop()}
        src={themedSrcUrl}
      ></iframe>
    {:else}
      <slot />
    {/if}
  </div>
  <div class="code-override">
    <CodeSnippet type="multi" code={codeRaw} copy={(text) => copy(text)}>
      {@html code}
    </CodeSnippet>
  </div>
</div>

<style>
  .preview {
    margin-bottom: var(--cds-layout-04);
    margin-left: -1rem;
    margin-right: -1rem;
  }

  /* The negative margins above cancel the column's 1rem padding. On mobile
                 the doc grid collapses that padding to 0 (see global.css), so reset the
                 margins to keep the preview aligned with the flush content edge. */
  @media (max-width: 672px) {
    .preview {
      margin-left: 0;
      margin-right: 0;
    }
  }

  .preview-viewer {
    border: 1px solid var(--cds-ui-03);
    border-bottom: 0;
    position: relative;
    /* Above side nav for breakout content but below portal content */
    z-index: 9100;
  }

  /* Below the lg breakpoint the side nav opens as a full-screen overlay
                 (z-index 8000) that must cover the page. Drop the breakout z-index here
                 so previews don't show through the open nav. */
  @media (max-width: 65.98rem) {
    .preview-viewer {
      z-index: auto;
    }
  }

  .preview-viewer:not(.framed) {
    padding: var(--cds-spacing-06) var(--cds-spacing-05);
  }

  .preview-viewer.framed {
    min-height: 20rem;
  }

  @media (min-width: 1920px) {
    .preview-viewer.framed {
      min-height: 32rem;
    }
  }

  .framed-header {
    display: flex;
    align-items: center;
  }

  @media (max-width: 580px) {
    .iframe-label {
      display: none;
    }
  }

  iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
</style>
