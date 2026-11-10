<script>
  /**
   * Specify the block to draw.
   * @type {import("../utils/markdown.js").MarkdownBlock}
   */
  export let block;

  /** Specify the `target` of links */
  export let target = "_blank";

  /** Specify the heading level that `#` draws as */
  export let headingLevel = 3;

  /** Specify the accessible name of a table, which scrolls sideways when it is wide */
  export let tableLabel = "Table";

  /** Specify the accessible name of a checked task */
  export let doneLabel = "Done";

  /** Specify the accessible name of an unchecked task */
  export let todoLabel = "To do";

  import MarkdownEditorRuns from "./MarkdownEditorRuns.svelte";
</script>

{#if block.type === "paragraph"}
  <p dir="auto">
    <MarkdownEditorRuns runs={block.runs} {target} />
  </p>
{:else if block.type === "heading"}
  <svelte:element
    this={`h${Math.min(6, headingLevel + block.level - 1)}`}
    dir="auto"
  >
    <MarkdownEditorRuns runs={block.runs} {target} />
  </svelte:element>
{:else if block.type === "code"}
  <!-- A long line scrolls inside the block, which takes focus so the
       keyboard can scroll it. -->
  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  <pre tabindex="0"><code>{block.text}</code></pre>
{:else if block.type === "quote"}
  <blockquote dir="auto">
    {#each block.blocks as child (child.id)}
      <svelte:self
        block={child}
        {target}
        {headingLevel}
        {tableLabel}
        {doneLabel}
        {todoLabel}
      />
    {/each}
  </blockquote>
{:else if block.type === "list"}
  <svelte:element
    this={block.ordered ? "ol" : "ul"}
    start={block.ordered && block.start !== 1 ? block.start : undefined}
    dir="auto"
  >
    {#each block.items as item, index (index)}
      <li class:task-list-item={item.checked !== undefined}>
        {#if item.checked !== undefined}<input
            type="checkbox"
            checked={item.checked}
            disabled
            aria-label={item.checked ? doneLabel : todoLabel}
          />{/if}
        <MarkdownEditorRuns runs={item.runs} {target} />
        {#each item.children as child (child.id)}
          <svelte:self
            block={child}
            {target}
            {headingLevel}
            {tableLabel}
            {doneLabel}
            {todoLabel}
          />
        {/each}
      </li>
    {/each}
  </svelte:element>
{:else if block.type === "table"}
  <!-- A wide table scrolls inside its own box, which takes focus so the
       keyboard can scroll it. -->
  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  <div role="group" tabindex="0" aria-label={tableLabel}>
    <table>
      <thead>
        <tr>
          {#each block.head as cell, column (column)}
            <th scope="col" align={block.align[column] ?? undefined} dir="auto">
              <MarkdownEditorRuns runs={cell} {target} />
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each block.rows as row, rowIndex (rowIndex)}
          <tr>
            {#each row as cell, column (column)}
              <td align={block.align[column] ?? undefined} dir="auto">
                <MarkdownEditorRuns runs={cell} {target} />
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{:else if block.type === "rule"}
  <hr />
{/if}
