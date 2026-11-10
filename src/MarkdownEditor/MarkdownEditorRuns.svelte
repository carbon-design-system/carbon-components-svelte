<script>
  /**
   * Specify the runs to draw.
   * @type {ReadonlyArray<import("../utils/markdown.js").MarkdownRun>}
   */
  export let runs = [];

  /** Specify the `target` of links */
  export let target = "_blank";

  import MarkdownEditorRun from "./MarkdownEditorRun.svelte";
</script>

{#each runs as run, index (index)}{#if run.br}<br
    />{:else if run.href || run.strong || run.em || run.del || run.code}<MarkdownEditorRun
      {run}
      {target}
    />{:else}{run.text}{/if}{/each}
