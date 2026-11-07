<script>
  /**
   * @restProps {div}
   */

  /**
   * The text of the comment: plain text with `@[Name](id)` mentions, links
   * and a small Markdown subset (`**bold**`, `*italic*`, `` `code` ``, fenced
   * code, `> quotes`, `- bullets`, `[text](https://…)`). It is rendered as
   * elements, never as HTML, so a body cannot inject markup. Links to
   * anything but `http`, `https` and `mailto` stay text.
   */
  export let body = "";

  import ActivityBodyRuns from "./ActivityBodyRuns.svelte";
  import { parseActivityBody } from "./activity-body.js";

  $: blocks = parseActivityBody(body);
</script>

<div class:bx--activity-body={true} {...$$restProps}>
  {#each blocks as block, index (index)}
    <!-- Each block takes the direction of its own first strong character,
         so an Arabic reply under an English comment reads from the right. -->
    {#if block.type === "paragraph"}
      <p dir="auto"><ActivityBodyRuns runs={block.runs} /></p>
    {:else if block.type === "quote"}
      <blockquote dir="auto"><ActivityBodyRuns runs={block.runs} /></blockquote>
    {:else if block.type === "list"}
      <ul dir="auto">
        {#each block.items as runs, item (item)}
          <li><ActivityBodyRuns {runs} /></li>
        {/each}
      </ul>
    {:else if block.type === "code"}
      <!-- A scrollable region needs a way in for keyboard users. -->
      <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
      <pre dir="ltr" tabindex="0"><code>{block.text}</code></pre>
    {/if}
  {/each}
</div>
