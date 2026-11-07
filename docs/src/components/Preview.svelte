<script lang="ts">
  /** The example's code, highlighted here rather than in the bundle. */
  export let code = "";
  export let src = "";
  export let framed = false;

  import { Button, CodeSnippet, LazyMount } from "carbon-components-svelte";
  import { highlight } from "carbon-components-svelte/syntax";
  import Launch from "carbon-icons-svelte/lib/Launch.svelte";
  import { flushSync, onMount } from "svelte";
  import { queueIdleMount } from "../idle-mount";
  import { eagerContent } from "../router";
  import { theme } from "../store";

  /**
   * A code view is a CodeSnippet, with its buttons, and highlighting adds
   * hundreds of elements, so both wait until the view comes within this
   * distance of the viewport. Until then it's the same text, uncolored, in
   * a plain `<pre>` of the same height, which find in page still reaches.
   */
  const HIGHLIGHT_MARGIN = "1000px 0px";

  let codeView: HTMLElement;
  let viewer: HTMLElement;
  let nearViewport = false;
  let mounted = false;
  let idle = false;
  let unqueue = () => {};

  $: if (mounted) unqueue();

  onMount(() => {
    if (!framed && !mounted) {
      unqueue = queueIdleMount(viewer, () => {
        idle = true;
        flushSync();
      });
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        nearViewport = true;
        observer.disconnect();
      },
      { rootMargin: HIGHLIGHT_MARGIN },
    );
    observer.observe(codeView);
    return () => {
      observer.disconnect();
      unqueue();
    };
  });

  /**
   * A code view's height once rendered, which it reserves while the browser
   * skips it as off-screen and its placeholder takes: a 1rem row a line and
   * the code's 1.5rem bottom padding, capped at the collapsed snippet's
   * 240 px, which CodeSnippet sets in pixels, plus 2rem around them, inside
   * the view's border. In rem, it follows the reader's font size as the
   * snippet does. With a guess instead, a view above the reader changed
   * height as it rendered, and moved the page in Safari, which doesn't
   * anchor the scroll. Keep in step with CodeSnippet's multi-line styles.
   */
  $: codeViewHeight = `calc(min(${code.replace(/\n$/, "").split("\n").length}rem + 1.5rem, 240px) + 2rem)`;

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
  <div class="preview-viewer" class:framed bind:this={viewer}>
    {#if framed}
      <iframe loading="lazy" title={src.split("/").pop()} src={themedSrcUrl}
      ></iframe>
    {:else}
      <!-- A long page mounts its examples as they near the viewport, which
           halves its load time, and the rest once the browser is idle.
           64 px is a typical example's content height. -->
      <LazyMount
        rootMargin="1200px"
        estimatedHeight={64}
        eager={$eagerContent || idle}
        bind:mounted
      >
        <slot />
      </LazyMount>
    {/if}
  </div>
  <div
    class="code-override"
    style:contain-intrinsic-size="auto {codeViewHeight}"
    bind:this={codeView}
  >
    {#if nearViewport}
      <CodeSnippet type="multi" {code}>
        {#if highlighted}{@html highlighted}{:else}{code}{/if}
      </CodeSnippet>
    {:else}
      <pre class="code-placeholder" style:height={codeViewHeight}>{code}</pre>
    {/if}
  </div>
</div>

<style>
  .code-placeholder {
    overflow: hidden;
    margin: 0;
    padding: 1rem;
    background-color: var(--cds-layer-01);
    color: var(--cds-text-primary);
    font-family: "IBM Plex Mono", Menlo, "DejaVu Sans Mono", monospace;
    font-size: 0.875rem;
    line-height: 1.25rem;
  }

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
