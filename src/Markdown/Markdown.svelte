<script>
  /**
   * @restProps {div}
   */

  /**
   * Specify the Markdown to draw. Append to it as text arrives; only the
   * last block is parsed and drawn again.
   */
  export let source = "";

  /**
   * Set to `true` while `source` is still growing: an unfinished `**`,
   * `*`, `~~` or backtick at the end shows as formatted instead of as
   * punctuation, and a caret follows the text.
   */
  export let streaming = false;

  /** Set to `false` to leave out the caret while `streaming` */
  export let caret = true;

  /**
   * Specify the link schemes, with the colon. Anything else, such as
   * `javascript:`, shows as text.
   * @type {ReadonlyArray<string>}
   */
  export let schemes = ["http:", "https:", "mailto:"];

  /** Specify the `target` of links */
  export let linkTarget = "_blank";

  /**
   * Specify the heading level that `#` draws as, so a reply's headings sit
   * under the page's. `##` is one level lower, down to `h6`.
   * @type {1 | 2 | 3 | 4 | 5 | 6}
   */
  export let headingLevel = 3;

  /**
   * Specify the type scale of the copy, as `Prose`'s `variant`.
   * @type {"condensed" | "compact" | "default" | "spacious"}
   */
  export let variant = "compact";

  /**
   * Color code blocks with a function that returns tokens for a language,
   * or `undefined` for one it doesn't know, such as `tokenize` from
   * `carbon-components-svelte/syntax`. Load `css/syntax.css` and
   * `css/syntax-tokens.css` for the colors. A block still open is drawn
   * plain once it passes 4,000 characters.
   * @type {((code: string, lang: string) => ReadonlyArray<{ type: string | null, text: string }> | undefined) | undefined}
   */
  export let highlight = undefined;

  /** Set to `false` to leave out the copy button on code blocks */
  export let copyable = true;

  /** Specify the label of the copy button on code blocks */
  export let copyLabel = "Copy code";

  /**
   * Specify the name of a code block, announced and shown above it.
   * @type {(lang: string) => string}
   */
  export let codeLabel = (lang) => lang || "Code";

  /** Specify the accessible name of a table, which scrolls sideways when it is wide */
  export let tableLabel = "Table";

  /**
   * Obtain a reference to the root element.
   * @type {null | HTMLElement}
   * @bindable readonly
   */
  export let ref = null;

  import Prose from "../Prose/Prose.svelte";
  import MarkdownBlock from "./MarkdownBlock.svelte";
  import { createMarkdownParser } from "./markdown.js";

  $: parser = createMarkdownParser({ schemes });

  /** @type {import("./markdown.js").MarkdownBlock[]} */
  let frozen = [];

  // The parser hands back the same objects for the blocks it has finished.
  // `frozen` changes only when one more finishes, so the list of finished
  // blocks is left alone while the last one grows.
  $: result = parser.parse(source, streaming);
  $: {
    const next = result.blocks.slice(0, result.frozen);
    if (
      next.length !== frozen.length ||
      next[next.length - 1] !== frozen[frozen.length - 1]
    ) {
      frozen = next;
    }
  }
  // The blocks after those are still open: usually one, two while the last
  // is a line still being written.
  $: open = result.blocks.slice(result.frozen);

  $: config = {
    highlight,
    copyable,
    copyLabel,
    codeLabel,
    tableLabel,
    target: linkTarget,
    headingLevel,
  };
</script>

<Prose
  bind:ref
  {variant}
  maxWidth="none"
  {...$$restProps}
  class="bx--markdown {$$restProps.class ?? ''}"
>
  {#each frozen as block (block.id)}
    <MarkdownBlock {block} {config} />
  {/each}
  {#each open as block, index (block.id)}
    <MarkdownBlock
      {block}
      {config}
      tail={streaming && caret && index === open.length - 1}
    />
  {/each}
</Prose>
