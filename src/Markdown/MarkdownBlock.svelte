<script>
  /**
   * Specify the block to draw.
   * @type {import("./markdown.js").MarkdownBlock}
   */
  export let block;

  /** Set to `true` when the block is the last, so the streaming caret follows its text */
  export let tail = false;

  /**
   * Specify how to draw the blocks.
   * @type {import("./markdown.js").DrawOptions}
   */
  export let config;

  import MarkdownCode from "./MarkdownCode.svelte";
  import MarkdownRuns from "./MarkdownRuns.svelte";
</script>

{#if block.type === "paragraph"}
  <p dir="auto">
    <MarkdownRuns runs={block.runs} target={config.target} caret={tail} />
  </p>
{:else if block.type === "heading"}
  <svelte:element
    this={`h${Math.min(6, config.headingLevel + block.level - 1)}`}
    dir="auto"
  >
    <MarkdownRuns runs={block.runs} target={config.target} caret={tail} />
  </svelte:element>
{:else if block.type === "code"}
  <MarkdownCode {block} {config} caret={tail} />
{:else if block.type === "quote"}
  <blockquote dir="auto">
    {#each block.blocks as child, index (child.id)}
      <svelte:self
        block={child}
        {config}
        tail={tail && index === block.blocks.length - 1}
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
      <li>
        <MarkdownRuns
          runs={item.runs}
          target={config.target}
          caret={tail &&
            index === block.items.length - 1 &&
            item.children.length === 0}
        />
        {#each item.children as child, childIndex (child.id)}
          <svelte:self
            block={child}
            {config}
            tail={tail &&
              index === block.items.length - 1 &&
              childIndex === item.children.length - 1}
          />
        {/each}
      </li>
    {/each}
  </svelte:element>
{:else if block.type === "table"}
  <!-- A wide table scrolls inside its own box, which takes focus so the
       keyboard can scroll it. -->
  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  <div role="group" tabindex="0" aria-label={config.tableLabel}>
    <table>
      <thead>
        <tr>
          {#each block.head as cell, column (column)}
            <th scope="col" align={block.align[column] ?? undefined} dir="auto">
              <MarkdownRuns runs={cell} target={config.target} />
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each block.rows as row, rowIndex (rowIndex)}
          <tr>
            {#each row as cell, column (column)}
              <td align={block.align[column] ?? undefined} dir="auto">
                <MarkdownRuns
                  runs={cell}
                  target={config.target}
                  caret={tail &&
                    rowIndex === block.rows.length - 1 &&
                    column === row.length - 1}
                />
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
