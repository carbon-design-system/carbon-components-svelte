<script lang="ts">
  export let code = "";
  export let codeRaw = "";
  export let src = "";
  export let framed = false;

  import { url } from "@roxi/routify";
  import { Button, CodeSnippet } from "carbon-components-svelte";
  import Launch from "carbon-icons-svelte/lib/Launch.svelte";
  import copy from "clipboard-copy";
  import { theme } from "../store";

  $: resolvedSrc = src ? $url(src) : "";
  $: themedSrcUrl = resolvedSrc ? `${resolvedSrc}?theme=${$theme}` : "";
</script>

<div class="preview">
  {#if framed}
    <div class="framed-header">
      <Button
        kind="ghost"
        target="_blank"
        size="small"
        href={resolvedSrc}
        icon={Launch}
        iconDescription="Isolated preview"
        tooltipPosition="top"
        tooltipAlignment="end"
        style="margin-left: auto;"
      > </Button>
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

  iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
</style>
