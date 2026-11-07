<script>
  import { createInputLayer, TextArea } from "carbon-components-svelte";
  import { onMount } from "svelte";

  const TOKEN = /(\d+(?:\.\d+)?)|([A-Za-z_]+)|([^\dA-Za-z_]+)/g;

  /**
   * Color the numbers and names of a formula. The field keeps its caret,
   * selection, undo and spell check: only the colors are the layer's.
   * @param {string} text
   */
  function highlight(text) {
    return Array.from(text.matchAll(TOKEN), (match) => ({
      text: match[0],
      className: match[1] ? "number" : match[2] ? "name" : undefined,
    }));
  }

  /** @type {null | HTMLTextAreaElement} */
  let ref = null;
  let value = "ROUND(price * 1.2, 2)\n  + shipping";
  let layer = null;

  onMount(() => {
    // The field's own glyphs go transparent; the layer draws them in color.
    // Forced colors give them back to the field.
    layer = createInputLayer(ref, { ink: "layer", segments: highlight });
    return () => layer.destroy();
  });

  /** @param {string} _value */
  function redraw(_value) {
    layer?.update();
  }

  $: redraw(value);
</script>

<TextArea labelText="Formula" rows={3} spellcheck="false" bind:ref bind:value />

<style>
  :global(.number) {
    color: var(--cds-tag-color-purple);
  }

  :global(.name) {
    color: var(--cds-tag-color-blue);
  }
</style>
