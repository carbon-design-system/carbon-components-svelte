<script>
  /**
   * Specify the code block.
   * @type {Extract<import("./markdown.js").MarkdownBlock, { type: "code" }>}
   */
  export let block;

  /**
   * Specify how to draw the block.
   * @type {import("./markdown.js").DrawOptions}
   */
  export let config;

  /** Set to `true` to end with the streaming caret */
  export let caret = false;

  import CopyButton from "../CopyButton/CopyButton.svelte";
  import { uniqueId } from "../utils/unique-id.js";

  /** An open block this long is drawn plain, so a long one isn't colored again with every chunk. */
  const OPEN_HIGHLIGHT_LIMIT = 4000;

  const id = uniqueId();

  $: tokens =
    config.highlight &&
    block.lang &&
    (block.closed || block.text.length <= OPEN_HIGHLIGHT_LIMIT)
      ? config.highlight(block.text, block.lang)
      : undefined;
</script>

<!-- No Carbon class on the figure or the `pre`: `Prose` styles plain
     elements, and skips anything inside a classed one. -->
<figure aria-labelledby="{id}-label">
  <figcaption class:bx--markdown__code-header={true}>
    <span id="{id}-label" class:bx--markdown__code-lang={true}
      >{config.codeLabel(block.lang)}</span
    >
    {#if config.copyable && block.text}
      <CopyButton
        kind="ghost"
        size="sm"
        text={block.text}
        iconDescription={config.copyLabel}
      />
    {/if}
  </figcaption>
  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  <pre tabindex="0"><code
      >{#if tokens}{#each tokens as token, index (index)}{#if token.type}<span
        class="tok-{token.type}">{token.text}</span
      >{:else}{token.text}{/if}{/each}{:else}{block.text}{/if}{#if caret}<span
        class:bx--markdown__caret={true}
        aria-hidden="true"></span>{/if}</code
    ></pre>
</figure>
