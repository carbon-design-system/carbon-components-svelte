<script lang="ts">
  export let codeId = "";
  export let codeRaw = "";
  export let src = "";
  export let framed = false;

  import { url } from "@roxi/routify";
  import { Button, CodeSnippet } from "carbon-components-svelte";
  import Launch from "carbon-icons-svelte/lib/Launch.svelte";
  import copy from "clipboard-copy";
  import { onMount } from "svelte";
  import { theme } from "../store";

  let highlightedHtml = "";
  let previewEl: HTMLDivElement | undefined;

  $: resolvedSrc = src ? $url(src) : "";
  $: themedSrcUrl = resolvedSrc ? `${resolvedSrc}?theme=${$theme}` : "";

  onMount(() => {
    if (!codeId || !previewEl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || highlightedHtml) return;

        observer.disconnect();
        void import(`../preview-snippets/${codeId}.json`).then((module) => {
          highlightedHtml = module.default.html;
        });
      },
      { rootMargin: "200px" },
    );

    observer.observe(previewEl);

    return () => observer.disconnect();
  });
</script>

<div class="preview" bind:this={previewEl}>
  {#if framed}
    <div class="framed-header">
      <div
        class="iframe-label"
        aria-hidden="true"
        style="margin-left: var(--cds-spacing-05); color: var(--cds-text-02); user-select: none"
      >
        Content loaded in iframe
      </div>
      <Button
        style="margin-left: auto;"
        kind="ghost"
        target="_blank"
        size="field"
        href={resolvedSrc}
        icon={Launch}
      >
        Open in new tab
      </Button>
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
      {#if highlightedHtml}
        {@html highlightedHtml}
      {:else}
        <pre class="language-svelte"><code>{codeRaw}</code></pre>
      {/if}
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
