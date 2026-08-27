<script lang="ts">
  import MultiSelect from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
  import type { ComponentProps } from "svelte";

  type MeasuredItem = {
    id: string;
    text: string;
    height: number;
    isSelectAll?: boolean;
  };

  export let items: MeasuredItem[] = [];
  export let selectedIds: string[] = [];
  export let virtualize: ComponentProps<MultiSelect>["virtualize"] = undefined;
  export let wrapOptions: ComponentProps<MultiSelect>["wrapOptions"] = false;
  export let filterable = false;
  export let selectionFeedback: ComponentProps<MultiSelect>["selectionFeedback"] =
    "top-after-reopen";
  /**
   * Input order by default, so a test that says nothing about ordering reads
   * the same list it declared. The default comparator sorts by text, which
   * would put every assertion about a position at one remove from the fixture.
   */
  export let sortItem: (a: MeasuredItem, b: MeasuredItem) => number = () => 0;

  let value = "";
</script>

<!-- The height each option renders at travels on the option itself, so the
     suite's stubbed ResizeObserver can report a different one per item — which
     is the only way heights held against the wrong option are observable. -->
<MultiSelect
  labelText="Items"
  label="Items"
  placeholder="Filter…"
  portalMenu={false}
  {items}
  {filterable}
  {selectionFeedback}
  {sortItem}
  {virtualize}
  {wrapOptions}
  bind:value
  bind:selectedIds
  let:item
>
  <span data-measured-height={item.height}>{item.text}</span>
</MultiSelect>
