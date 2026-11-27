<script>
  /**
   * Markdown blocks as elements. Text goes in as text nodes and links are
   * checked by the parser, so nothing here is HTML. Not exported.
   */

  /**
   * Specify the blocks to draw.
   * @type {import("../markdown-lite.js").MarkdownBlock[]}
   */
  export let blocks = [];

  /** Specify the level `#` draws as, so headings nest under the page's. */
  export let headingLevel = 3;

  /**
   * Specify what the renderer is given.
   * @type {import("../file-preview.js").PreviewOptions}
   */
  export let options;

  import { chunkEnd, highlightTokens } from "../file-preview.js";
  import FilePreviewRuns from "./FilePreviewRuns.svelte";

  /** @param {string} text */
  function clip(text) {
    return text.slice(0, chunkEnd(text, 0));
  }

  /**
   * @param {number} level
   * @param {number} base
   */
  function tagFor(level, base) {
    return `h${Math.min(6, base + level - 1)}`;
  }
</script>

{#each blocks as block, index (index)}
  {#if block.type === "paragraph"}
    <p dir="auto"><FilePreviewRuns runs={block.runs} /></p>
  {:else if block.type === "heading"}
    <svelte:element this={tagFor(block.level, headingLevel)} dir="auto"
      ><FilePreviewRuns runs={block.runs} /></svelte:element
    >
  {:else if block.type === "code"}
    <pre dir="ltr"><code
        >{#each highlightTokens(clip(block.text), block.lang, options.highlight) as token, tokenIndex (tokenIndex)}{#if token.type}<span
          class="tok-{token.type}">{token.text}</span
        >{:else}{token.text}{/if}{/each}</code
      ></pre>
  {:else if block.type === "quote"}
    <blockquote>
      <svelte:self blocks={block.blocks} {headingLevel} {options} />
    </blockquote>
  {:else if block.type === "list"}
    <svelte:element
      this={block.ordered ? "ol" : "ul"}
      start={block.ordered && block.start !== 1 ? block.start : undefined}
    >
      {#each block.items as item, itemIndex (itemIndex)}
        <li dir="auto">
          <FilePreviewRuns runs={item.runs} />
          {#if item.blocks.length > 0}
            <svelte:self blocks={item.blocks} {headingLevel} {options} />
          {/if}
        </li>
      {/each}
    </svelte:element>
  {:else if block.type === "rule"}
    <hr />
  {/if}
{/each}
