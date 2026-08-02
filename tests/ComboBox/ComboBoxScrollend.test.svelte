<script lang="ts">
  import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";
  import type { ComponentProps } from "svelte";

  export let items: ComponentProps<ComboBox>["items"] = [];
  export let open: ComponentProps<ComboBox>["open"] = false;
  export let virtualize: ComponentProps<ComboBox>["virtualize"] = {
    containerHeight: 200,
    threshold: 1,
  };
  export let shouldFilterItem: ComponentProps<ComboBox>["shouldFilterItem"] =
    () => true;
  export let onScrollend: (
    e: CustomEvent<{
      scrollTop: number;
      scrollHeight: number;
      clientHeight: number;
    }>,
  ) => void = () => {};
  export let onScroll: (e: Event) => void = () => {};
</script>

<ComboBox
  {items}
  bind:open
  {virtualize}
  {shouldFilterItem}
  labelText="Contact"
  placeholder="Select…"
  portalMenu={false}
  on:scrollend={onScrollend}
  on:scroll={onScroll}
/>
