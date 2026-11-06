<script lang="ts">
  /** The example's code, highlighted here rather than in the bundle. */
  export let code = "";
  export let src = "";
  export let framed = false;

  import { Button, CodeSnippet } from "carbon-components-svelte";
  import { highlight } from "carbon-components-svelte/syntax";
  import Launch from "carbon-icons-svelte/lib/Launch.svelte";
  import { onMount } from "svelte";
  import { theme } from "../store";

  /**
   * Highlighting a code view adds hundreds of elements, so it waits until
   * the view comes within this distance of the viewport. Until then it
   * shows the same text, uncolored.
   */
  const HIGHLIGHT_MARGIN = "1000px 0px";

  let codeView: HTMLElement;
  let nearViewport = false;

  onMount(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        nearViewport = true;
        observer.disconnect();
      },
      { rootMargin: HIGHLIGHT_MARGIN },
    );
    observer.observe(codeView);
    return () => observer.disconnect();
  });

  $: themedSrcUrl = src ? `${src}?theme=${$theme}` : "";
  $: highlighted = nearViewport ? (highlight(code, "svelte") ?? "") : "";
</script>

<div class="preview">
  {#if framed}
    <div class="framed-header">
      <Button
        kind="ghost"
        target="_blank"
        size="small"
        href={src}
        icon={Launch}
        iconDescription="Isolated preview"
        tooltipPosition="top"
        tooltipAlignment="end"
        style="margin-left: auto;"
      ></Button>
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
  <div class="code-override" bind:this={codeView}>
    <CodeSnippet type="multi" {code}>
      {#if nearViewport}{@html highlighted}{:else}{code}{/if}
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
    border: 1px solid var(--cds-border-subtle-01);
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

  /* Every viewer shares one z-index, so a later one paints over an open
     menu or calendar that overflows the one in use. Lift that one. */
  .preview-viewer:not(.framed):focus-within {
    z-index: 9101;
  }

  .preview-viewer.framed {
    min-height: 20rem;
  }

  @media (min-width: 1920px) {
    .preview-viewer.framed {
      min-height: 32rem;
    }
  }

  /* Skip style, layout and paint for off-screen snippets; the highlighted
     code is most of a page's rendering cost. Not on `.preview`: containment
     would clip menus and tooltips that overflow the example. */
  .code-override {
    content-visibility: auto;
    contain-intrinsic-size: auto 250px;
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
