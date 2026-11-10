<script>
  /**
   * Specify the runs to draw.
   * @type {ReadonlyArray<import("./markdown.js").MarkdownRun>}
   */
  export let runs = [];

  /** Set to `true` to end with the streaming caret */
  export let caret = false;

  /** Specify the `target` of links */
  export let target = "_blank";

  import MarkdownRun from "./MarkdownRun.svelte";
</script>

{#each runs as run, index (index)}{#if run.br}<br
    />{:else if run.href || run.strong || run.em || run.del || run.code}<MarkdownRun
      {run}
      {target}
    />{:else}{run.text}{/if}{/each}{#if caret}<span
    class:bx--markdown__caret={true}
    aria-hidden="true"
  ></span>{/if}
