<script lang="ts">
  import MultiSelect from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
  import type { ComponentProps } from "svelte";

  export let selectedIds: string[] = ["a", "c"];
  type Props = ComponentProps<MultiSelect>;
  export let config: {
    selectionDisplay?: Props["selectionDisplay"];
    selectionFeedback?: Props["selectionFeedback"];
    tagOverflow?: Props["tagOverflow"];
    tagProps?: Props["tagProps"];
    readonly?: boolean;
  } = {};
  export let onSelect: (detail: { selectedIds: unknown }) => void = () => {};

  const items = [
    { id: "a", text: "Alpha" },
    { id: "b", text: "Beta" },
    { id: "c", text: "Gamma" },
    { id: "d", text: "Delta", disabled: true },
  ];
</script>

<form data-testid="form">
  <MultiSelect
    id="ms"
    labelText="Letters"
    name="letters"
    {items}
    selectionDisplay="tags"
    {...config}
    bind:selectedIds
    on:select={(e) => onSelect(e.detail)}
  />
</form>

<div data-testid="selected">{JSON.stringify(selectedIds)}</div>
