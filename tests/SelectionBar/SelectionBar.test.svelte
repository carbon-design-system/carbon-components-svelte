<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import SelectionBar from "carbon-components-svelte/SelectionBar/SelectionBar.svelte";
  import Tag from "carbon-components-svelte/Tag/Tag.svelte";
  import type { ComponentProps } from "svelte";

  type Props = ComponentProps<SelectionBar>;

  export let count = 2;
  export let placement: Props["placement"] = "content";
  export let selectedText: Props["selectedText"] | undefined = undefined;
  export let returnFocusTo: Props["returnFocusTo"] = null;
  export let label: string | undefined = undefined;
  export let clearOnClear = true;
  // Download stands in for Delete: it removes the button focus came from,
  // as Delete removes a row and its checkbox, and empties the selection.
  export let downloadDeletes = false;
  export let onClear: (detail: { count: number }) => void = () => {};

  let showBefore = true;
</script>

{#if showBefore}
  <button type="button" data-testid="before">Select Billing</button>
{/if}
<SelectionBar
  {count}
  {placement}
  {returnFocusTo}
  {...selectedText ? { selectedText } : {}}
  {...label ? { "aria-label": label } : {}}
  data-testid="bar"
  on:clear={(event) => {
    onClear(event.detail);
    if (clearOnClear) count = 0;
  }}
>
  <svelte:fragment slot="actions">
    <Button
      on:click={() => {
        if (!downloadDeletes) return;
        showBefore = false;
        count = 0;
      }}>Download</Button
    >
  </svelte:fragment>
  <svelte:fragment slot="items">
    <Tag>Billing</Tag>
  </svelte:fragment>
</SelectionBar>
<p data-testid="count">{count}</p>
<button type="button" data-testid="fallback">Services</button>
