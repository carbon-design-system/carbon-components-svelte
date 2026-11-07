<script>
  /**
   * Specify the run to draw. Each flag it carries is one element around
   * the text, outermost first: link, strong, em, del, code.
   * @type {import("../utils/markdown.js").MarkdownRun}
   */
  export let run;

  /** Specify the `target` of links */
  export let target = "_blank";

  /**
   * Specify how many of the run's elements are drawn already.
   * @type {number}
   */
  export let depth = 0;

  $: chain = [
    run.href && "a",
    run.strong && "strong",
    run.em && "em",
    run.del && "del",
    run.code && "code",
  ].filter(Boolean);
  $: tag = chain[depth];
  $: rel = target === "_blank" ? "noopener noreferrer nofollow" : "nofollow";
</script>

{#if tag === "a"}<a href={run.href} {target} {rel}
    ><svelte:self {run} {target} depth={depth + 1} /></a
  >{:else if tag}<svelte:element this={tag}
    ><svelte:self {run} {target} depth={depth + 1} /></svelte:element
  >{:else}{run.text}{/if}
