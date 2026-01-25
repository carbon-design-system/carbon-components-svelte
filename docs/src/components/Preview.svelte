<script>
  export let code = "";
  export let codeRaw = "";
  export let src = "";
  export let framed = false;

  import { url } from "@sveltech/routify";
  import { Button, CodeSnippet } from "carbon-components-svelte";
  import Launch from "carbon-icons-svelte/lib/Launch.svelte";
  import copy from "clipboard-copy";
  import { theme } from "../store";

  $: themedSrcUrl = $url(`${src}?theme=${$theme}`);
</script>

<div class="preview">
  {#if framed}
    <div class="framed-header">
      <div
        class="iframe-label"
        style="margin-left: var(--cds-spacing-05); color: var(--cds-text-02)"
      >
        Content loaded in an iframe
      </div>
      <Button
        style="margin-left: auto;"
        kind="ghost"
        target="_blank"
        size="field"
        href={themedSrcUrl}
        icon={Launch}
      >
        Open in new tab
      </Button>
    </div>
  {/if}
  <div class="preview-viewer" class:framed>
    {#if framed}
      <iframe loading="lazy" title={src.split("/").pop()} src={themedSrcUrl}
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
    max-width: 80rem;
  }

  .preview-viewer {
    border: 1px solid var(--cds-ui-03);
    border-bottom: 0;
    position: relative;
    z-index: 9999;
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
