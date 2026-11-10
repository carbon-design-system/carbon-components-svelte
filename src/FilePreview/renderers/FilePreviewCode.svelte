<script>
  /**
   * Source text in a scrollable `pre`, shown a chunk at a time. The chunk
   * keeps the page light for a long file, and "Show more" reveals the next.
   * Shared by the text and JSON renderers; not exported.
   */

  /** Specify the text to show. */
  export let text = "";

  /**
   * Specify the `tokenize` language, or leave it unset for plain text.
   * @type {string | undefined}
   */
  export let language = undefined;

  /**
   * Specify the file name, which names the scrollable region.
   * @type {string}
   */
  export let name = "";

  /**
   * Specify the reading direction. Source reads left to right in any
   * language; prose does not.
   * @type {"ltr" | "auto"}
   */
  export let dir = "ltr";

  /**
   * Specify notes to show under the text, such as that the file is cut.
   * @type {string[]}
   */
  export let notes = [];

  /**
   * Specify what the renderer is given.
   * @type {import("../file-preview.js").PreviewOptions}
   */
  export let options;

  import { tick } from "svelte";
  import Button from "../../Button/Button.svelte";
  import { chunkEnd, highlightTokens, revealBidi } from "../file-preview.js";

  /** @type {HTMLElement | undefined} */
  let region;

  $: safe = revealBidi(text);

  let end = 0;
  /** @type {string | undefined} */
  let shownFor;
  $: if (safe !== shownFor) {
    shownFor = safe;
    end = chunkEnd(safe, 0);
  }

  $: shown = safe.slice(0, end);
  $: tokens = highlightTokens(shown, language, options.highlight);
  $: more = end < safe.length;

  async function showMore() {
    end = chunkEnd(safe, end);
    if (end >= safe.length) {
      // The button goes with the last chunk; keep focus in the file.
      await tick();
      region?.focus({ preventScroll: true });
    }
  }
</script>

<div class:bx--file-preview__text={true}>
  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  <div
    bind:this={region}
    class:bx--file-preview__code={true}
    role="group"
    aria-label={name}
    tabindex="0"
  >
    <pre {dir}><code
        >{#each tokens as token, index (index)}{#if token.type}<span
          class="tok-{token.type}">{token.text}</span
        >{:else}{token.text}{/if}{/each}</code
      ></pre>
  </div>
  {#if more || notes.length > 0}
    <div class:bx--file-preview__footer={true}>
      {#each notes as note (note)}
        <span>{note}</span>
      {/each}
      {#if more}
        <Button kind="ghost" size="sm" on:click={showMore}>
          {options.texts.showMore}
        </Button>
      {/if}
    </div>
  {/if}
</div>
