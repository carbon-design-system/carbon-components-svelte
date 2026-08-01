<script>
  /**
   * Default label text for a tree row, with the `filterText` match wrapped in
   * a `<mark>`. Internal to TreeView; not exported from the package barrel.
   * @typedef {[number, number]} MatchRange
   */

  /**
   * Specify the node text to render.
   * @type {any}
   */
  export let text = "";

  /**
   * Character offsets of the filter match within `text`.
   * `null` when the row is visible without matching.
   * @type {MatchRange | null}
   */
  export let match = null;

  $: highlight =
    match !== null && typeof text === "string"
      ? {
          before: text.slice(0, match[0]),
          matched: text.slice(match[0], match[1]),
          after: text.slice(match[1]),
        }
      : null;
</script>

<!-- biome-ignore format: the text around <mark> must stay flush; a line break here becomes a rendered space. -->
{#if highlight}{highlight.before}<mark class:bx--tree-node__match={true}>{highlight.matched}</mark>{highlight.after}{:else}{text}{/if}
