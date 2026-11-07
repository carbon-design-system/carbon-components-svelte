<script context="module" lang="ts">
  let offscreenObserver: IntersectionObserver | undefined;
</script>

<script lang="ts">
  export let code = "";
  export let src = "";
  export let framed = false;

  import { Button, CodeSnippet, LazyMount } from "carbon-components-svelte";
  import { highlight } from "carbon-components-svelte/syntax";
  import Launch from "carbon-icons-svelte/lib/Launch.svelte";
  import { flushSync, onMount } from "svelte";
  import { codeViewHeight } from "../code-view-height";
  import { queueIdleMount } from "../idle-mount";
  import { eagerContent } from "../router";
  import { theme } from "../store";

  /** Highlighting adds hundreds of elements, so it waits until near. */
  const HIGHLIGHT_MARGIN = "1000px 0px";

  let codeView: HTMLElement;
  let viewer: HTMLElement;
  let nearViewport = false;
  let mounted = false;
  let idle = false;
  let unqueue = () => {};

  $: if (mounted) unqueue();

  onMount(() => {
    if (!framed) {
      offscreenObserver ??= new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            entry.target.toggleAttribute(
              "data-offscreen",
              !entry.isIntersecting,
            );
          }
        },
        { rootMargin: "200px 0px" },
      );
      offscreenObserver.observe(viewer);
    }
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
      if (!framed) {
        offscreenObserver?.unobserve(viewer);
        viewer.removeAttribute("data-offscreen");
      }
    };
  });

  $: reservedHeight = codeViewHeight(code);

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
      <!-- Mounting near the viewport halves a long page's load time. -->
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
    style:contain-intrinsic-size="auto {reservedHeight}"
    bind:this={codeView}
  >
    {#if nearViewport}
      <CodeSnippet type="multi" {code}>
        {#if highlighted}{@html highlighted}{:else}{code}{/if}
      </CodeSnippet>
    {:else}
      <pre class="code-placeholder" style:height={reservedHeight}>{code}</pre>
    {/if}
  </div>
</div>

<style>
  /* 293 looping animations on DataTable's page cost a third of the main
     thread at rest. */
  .preview-viewer:global([data-offscreen]) :global(*),
  .preview-viewer:global([data-offscreen]) :global(*::before),
  .preview-viewer:global([data-offscreen]) :global(*::after) {
    animation-play-state: paused;
  }

  .code-placeholder {
    overflow: hidden;
    margin: 0;
    padding: var(--cds-spacing-05);
    background-color: var(--cds-layer-01);
    color: var(--cds-text-primary);
    font-family: "IBM Plex Mono", Menlo, "DejaVu Sans Mono", monospace;
    font-size: 0.875rem;
    line-height: 1.25rem;
  }

  .preview {
    margin-bottom: var(--cds-spacing-09);
    margin-inline: calc(-1 * var(--cds-spacing-05));
  }

  @media (max-width: 41.98rem) {
    .preview {
      margin-left: 0;
      margin-right: 0;
    }
  }

  .preview-viewer {
    border: 1px solid var(--cds-border-subtle-01);
    border-bottom: 0;
    position: relative;
    /* Above side nav, below portals. */
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

  /* Not on `.preview`: containment would clip overflowing menus. */
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
