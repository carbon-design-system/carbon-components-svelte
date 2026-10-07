<script lang="ts">
  import AILabel from "carbon-components-svelte/AILabel/AILabel.svelte";
  import AILabelActions from "carbon-components-svelte/AILabel/AILabelActions.svelte";
  import type { ComponentProps } from "svelte";

  export let size: ComponentProps<AILabel>["size"] = undefined;
  export let kind: ComponentProps<AILabel>["kind"] = undefined;
  export let textLabel = "";
  export let revertActive = false;
  export let onrevert: (() => void) | undefined = undefined;
</script>

<AILabel
  {size}
  {kind}
  {textLabel}
  bind:revertActive
  on:revert={() => onrevert?.()}
>
  <p>Generated from the last 30 days of incident logs.</p>
  <AILabelActions>
    <button type="button">View details</button>
  </AILabelActions>
</AILabel>
<span data-testid="revert-active">{revertActive}</span>
