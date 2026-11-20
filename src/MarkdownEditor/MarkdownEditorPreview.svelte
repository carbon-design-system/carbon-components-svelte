<script>
  /**
   * @restProps {div}
   */

  /**
   * Specify the Markdown to draw.
   * @type {string}
   */
  export let source = "";

  /**
   * Specify the link schemes, with the colon. Anything else, such as
   * `javascript:`, shows as text.
   * @type {ReadonlyArray<string>}
   */
  export let schemes = ["http:", "https:", "mailto:"];

  /** Specify the `target` of links */
  export let linkTarget = "_blank";

  /** Specify the heading level that `#` draws as; `##` is one lower, to `h6` */
  export let headingLevel = 2;

  /** Specify the accessible name of a table */
  export let tableLabel = "Table";

  /** Specify the accessible name of a checked task */
  export let doneLabel = "Done";

  /** Specify the accessible name of an unchecked task */
  export let todoLabel = "To do";

  /** Specify the text shown while there is nothing to draw */
  export let emptyText = "";

  import Prose from "../Prose/Prose.svelte";
  import { parseMarkdown } from "../utils/markdown.js";
  import MarkdownEditorBlock from "./MarkdownEditorBlock.svelte";

  $: blocks = source.trim() ? parseMarkdown(source, { schemes }) : [];
</script>

<Prose
  variant="compact"
  maxWidth="none"
  deferOffscreen
  {...$$restProps}
  class="bx--markdown-editor__prose {$$restProps.class ?? ''}"
>
  <!-- Keyed by position, not by `block.id` (the block's offset): an edit near
       the top moves every offset, and keyed by offset would rebuild every
       block below it. By position, each block patches its own text. -->
  {#each blocks as block, index (index)}
    <MarkdownEditorBlock
      {block}
      target={linkTarget}
      {headingLevel}
      {tableLabel}
      {doneLabel}
      {todoLabel}
    />
  {:else}
    <p class:bx--markdown-editor__empty={true}>{emptyText}</p>
  {/each}
</Prose>
