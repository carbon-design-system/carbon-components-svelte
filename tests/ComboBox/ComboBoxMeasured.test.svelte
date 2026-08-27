<script lang="ts">
  import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";
  import type { ComponentProps } from "svelte";

  type MeasuredItem = { id: string; text: string; height: number };

  export let items: MeasuredItem[] = [];
  export let selectedId: string | undefined = undefined;

  let value = "";
  export let virtualize: ComponentProps<ComboBox>["virtualize"] = undefined;
  export let wrapOptions: ComponentProps<ComboBox>["wrapOptions"] = false;
  export let filterMode: ComponentProps<ComboBox>["filterMode"] = undefined;
  export let shouldFilterItem: (item: MeasuredItem, value: string) => boolean =
    (item, value) => item.text.toLowerCase().includes(value.toLowerCase());
</script>

<!-- The height each option renders at travels on the option itself, so the
     suite's stubbed ResizeObserver can report a different one per item — which
     is the only way heights held against the wrong option are observable. -->
<ComboBox
  labelText="Items"
  placeholder="Filter…"
  portalMenu={false}
  {items}
  bind:value
  bind:selectedId
  {virtualize}
  {wrapOptions}
  {filterMode}
  {shouldFilterItem}
  let:item
>
  <span data-measured-height={item.height}>{item.text}</span>
</ComboBox>
