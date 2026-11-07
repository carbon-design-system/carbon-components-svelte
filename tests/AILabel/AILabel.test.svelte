<script lang="ts">
  import AILabel from "carbon-components-svelte/AILabel/AILabel.svelte";
  import AILabelActions from "carbon-components-svelte/AILabel/AILabelActions.svelte";
  import type { ComponentProps } from "svelte";

  export let size: ComponentProps<AILabel>["size"] = undefined;
  export let variant: ComponentProps<AILabel>["variant"] = undefined;
  export let labelText = "";
  export let edited = false;
  export let onrevert: (() => void) | undefined = undefined;
  export let open = false;
  export let align: ComponentProps<AILabel>["align"] = undefined;
  export let onopen: (() => void) | undefined = undefined;
  export let onclose: (() => void) | undefined = undefined;
</script>

<AILabel
  {size}
  {variant}
  {labelText}
  {align}
  bind:edited
  bind:open
  on:revert={() => onrevert?.()}
  on:open={() => onopen?.()}
  on:close={() => onclose?.()}
>
  <p>Generated from the last 30 days of incident logs.</p>
  <AILabelActions>
    <button type="button">View details</button>
  </AILabelActions>
</AILabel>
<span data-testid="edited">{edited}</span>
<span data-testid="open">{open}</span>
