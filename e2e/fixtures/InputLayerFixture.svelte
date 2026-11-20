<script>
  import {
    caretRect,
    createInputLayer,
    rangeRects,
    TextArea,
    TextInput,
  } from "carbon-components-svelte";
  import { onMount } from "svelte";

  const QUALIFIER = /(-?[a-z]+:)(\S*)/g;

  /**
   * Cut a query into plain runs and `key:value` runs.
   * @param {string} value
   */
  function qualifiers(value) {
    const runs = [];
    let at = 0;
    for (const match of value.matchAll(QUALIFIER)) {
      if (match.index > at) runs.push({ text: value.slice(at, match.index) });
      runs.push({ text: match[0], className: "lab-qualifier" });
      at = match.index + match[0].length;
    }
    if (at < value.length) runs.push({ text: value.slice(at) });
    return runs;
  }

  const NUMBER = /\d+(?:\.\d+)?/y;
  const WORD = /[A-Za-z_]+/y;
  const OTHER = /[^\dA-Za-z_]+/y;

  /**
   * Color the words and numbers of a formula.
   * @param {string} value
   */
  function formula(value) {
    const runs = [];
    let at = 0;
    while (at < value.length) {
      let kind = "";
      let end = at;
      for (const [pattern, name] of [
        [NUMBER, "lab-number"],
        [WORD, "lab-name"],
        [OTHER, ""],
      ]) {
        pattern.lastIndex = at;
        const hit = pattern.exec(value);
        if (hit) {
          kind = name;
          end = at + hit[0].length;
          break;
        }
      }
      runs.push({ text: value.slice(at, end), className: kind || undefined });
      at = end;
    }
    return runs;
  }

  let query;
  let formulaArea;
  let email;
  let queryValue = "is:open label:bug author:ada";
  let formulaValue = "ROUND(price * 1.2, 2) + tax";
  let emailValue = "ada@gm";

  onMount(() => {
    // For the tests, which build more fields than this page shows.
    window.__inputLayer = {
      createInputLayer,
      caretRect,
      rangeRects,
      qualifiers,
      formula,
    };
  });

  onMount(() => {
    const made = [
      createInputLayer(query, { position: "behind", segments: qualifiers }),
      createInputLayer(formulaArea, { ink: "layer", segments: formula }),
      createInputLayer(email, {
        position: "above",
        segments: (value) => [
          { text: value },
          {
            text: value.endsWith("gm") ? "ail.com" : "",
            className: "lab-ghost",
            ghost: true,
          },
        ],
      }),
    ];
    return () => {
      for (const layer of made) layer.destroy();
    };
  });
</script>

<div id="lab" style="max-width: 32rem; display: grid; gap: 1.5rem;">
  <TextInput
    data-testid="lab-query"
    labelText="Query"
    bind:ref={query}
    bind:value={queryValue}
  />
  <TextArea
    data-testid="lab-formula"
    labelText="Formula"
    rows={3}
    bind:ref={formulaArea}
    bind:value={formulaValue}
  />
  <TextInput
    data-testid="lab-email"
    labelText="Email"
    bind:ref={email}
    bind:value={emailValue}
  />
</div>

<style>
  :global(.lab-qualifier) {
    background-color: var(--cds-tag-background-blue);
    border-block-end: 2px solid var(--cds-tag-border-blue);
  }

  :global(.lab-number) {
    color: var(--cds-tag-color-purple);
  }

  :global(.lab-name) {
    color: var(--cds-tag-color-blue);
  }

  :global(.lab-ghost) {
    color: var(--cds-text-helper);
  }
</style>
