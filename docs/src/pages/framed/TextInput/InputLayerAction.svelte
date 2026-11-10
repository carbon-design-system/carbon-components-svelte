<script>
  import { inputLayer } from "carbon-components-svelte";

  const QUALIFIER = /-?[a-z]+:\S*/g;

  /** @param {string} text */
  function highlight(text) {
    const runs = [];
    let at = 0;
    for (const match of text.matchAll(QUALIFIER)) {
      if (match.index > at) runs.push({ text: text.slice(at, match.index) });
      runs.push({ text: match[0], className: "action-qualifier" });
      at = match.index + match[0].length;
    }
    if (at < text.length) runs.push({ text: text.slice(at) });
    return runs;
  }

  let value = "is:open label:bug";
</script>

<div class="bx--form-item">
  <label class="bx--label" for="native-query">Native query</label>
  <div class="bx--text-input__field-outer-wrapper">
    <div class="bx--text-input__field-wrapper">
      <input
        id="native-query"
        class="bx--text-input"
        bind:value
        use:inputLayer={{ segments: highlight, value }}
      />
    </div>
  </div>
</div>

<style>
  :global(.action-qualifier) {
    background-color: var(--cds-tag-background-purple);
    border-block-end: 2px solid var(--cds-tag-border-purple);
  }

  @media (forced-colors: active) {
    :global(.action-qualifier) {
      background-color: transparent;
    }
  }
</style>
