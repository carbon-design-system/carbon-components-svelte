<script>
  // TokenSearch (#5388) drew a transparent copy of a Search's text behind it
  // to put a fill and a rule under each qualifier. This is that layer on
  // `createInputLayer`: the grammar here is the smallest that shows the same
  // runs (`key:value`, `-key:value`, "a phrase"), and the layer's own code,
  // about 130 lines of placement, scroll and bidi, is the helper's.
  import { createInputLayer, Search } from "carbon-components-svelte";
  import { onMount } from "svelte";

  export let value = "is:open label:bug,ui author:ada -label:wontfix";

  const TOKEN = /("[^"]*"?)|(-?)([A-Za-z_][\w.-]*):("[^"]*"?|[^\s"]*)/g;

  /**
   * Cut a query into plain, qualifier and phrase runs.
   * @param {string} text
   */
  function runs(text) {
    const out = [];
    let at = 0;
    for (const match of text.matchAll(TOKEN)) {
      const [whole, phrase, negation, key, rest] = match;
      if (match.index > at) out.push({ text: text.slice(at, match.index) });
      if (phrase) {
        out.push({ text: whole, className: "port-phrase" });
      } else {
        const negated = negation === "-";
        const className = `port-qualifier${negated ? " port-negated" : ""}`;
        out.push({
          text: `${negation}${key}:`,
          className: `${className} port-key`,
        });
        if (rest) out.push({ text: rest, className });
      }
      at = match.index + whole.length;
    }
    if (at < text.length) out.push({ text: text.slice(at) });
    return out;
  }

  /** @type {null | HTMLInputElement} */
  let ref = null;
  let layer = null;
  let attached = null;

  // `ref` is a `bind:this` target, handed over again on every update.
  $: if (ref && ref !== attached) {
    layer?.destroy();
    attached = ref;
    layer = createInputLayer(ref, { position: "behind", segments: runs });
  }

  // A value set from code fires no `input`.
  /** @param {string} _value */
  function redraw(_value) {
    layer?.update();
  }

  $: redraw(value);

  onMount(() => () => layer?.destroy());
</script>

<div id="port" style="max-width: 32rem;">
  <Search
    data-testid="port-search"
    labelText="Search issues"
    placeholder="Search..."
    bind:ref
    bind:value
  />
</div>

<style>
  :global(.port-qualifier) {
    background-color: var(--cds-tag-background-blue);
    border-block-end: 2px solid var(--cds-tag-border-blue);
  }

  :global(.port-negated) {
    background-color: var(--cds-tag-background-red);
    border-block-end-color: var(--cds-tag-border-red);
  }

  :global(.port-phrase) {
    background-color: var(--cds-tag-background-purple);
    border-block-end: 2px solid var(--cds-tag-border-purple);
  }

  /* Forced colors keep the rule and drop the pale fill. */
  @media (forced-colors: active) {
    :global(.port-qualifier),
    :global(.port-phrase) {
      background-color: transparent;
    }
  }
</style>
