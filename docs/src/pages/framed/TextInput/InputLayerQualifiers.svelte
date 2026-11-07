<script>
  import { createInputLayer, TextInput } from "carbon-components-svelte";
  import { onMount } from "svelte";

  const QUALIFIER = /-?[a-z]+:\S*/g;

  /**
   * Cut a query into plain runs and `key:value` runs. The runs join back
   * to the value, so the layer's text is the field's.
   * @param {string} text
   */
  function highlight(text) {
    const runs = [];
    let at = 0;
    for (const match of text.matchAll(QUALIFIER)) {
      if (match.index > at) runs.push({ text: text.slice(at, match.index) });
      runs.push({ text: match[0], className: "qualifier" });
      at = match.index + match[0].length;
    }
    if (at < text.length) runs.push({ text: text.slice(at) });
    return runs;
  }

  /** @type {null | HTMLInputElement} */
  let ref = null;
  let value = "is:open label:bug author:ada free text";
  let layer = null;

  onMount(() => {
    layer = createInputLayer(ref, { position: "behind", segments: highlight });
    return () => layer.destroy();
  });

  // A value set from code fires no `input`: ask for the layer again.
  /** @param {string} _value */
  function redraw(_value) {
    layer?.update();
  }

  $: redraw(value);
</script>

<TextInput labelText="Search issues" bind:ref bind:value />

<style>
  /* A fill and a rule: neither changes the width of a glyph, and the rule
     stays in forced colors. */
  :global(.qualifier) {
    background-color: var(--cds-tag-background-blue);
    border-block-end: 2px solid var(--cds-tag-border-blue);
  }

  @media (forced-colors: active) {
    :global(.qualifier) {
      background-color: transparent;
    }
  }
</style>
