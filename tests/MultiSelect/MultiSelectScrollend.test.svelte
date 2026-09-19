<script lang="ts">
  import MultiSelect from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
  import type { ComponentProps } from "svelte";

  export let items: ComponentProps<MultiSelect>["items"] = [];
  export let open: ComponentProps<MultiSelect>["open"] = false;
  export let virtualize: ComponentProps<MultiSelect>["virtualize"] = {
    containerHeight: 200,
    threshold: 1,
  };
  export let onScrollend: (
    e: CustomEvent<{
      scrollTop: number;
      scrollHeight: number;
      clientHeight: number;
    }>,
  ) => void = () => {};
  export let onScroll: (e: Event) => void = () => {};
</script>

<MultiSelect
  {items}
  bind:open
  {virtualize}
  labelText="Contact"
  portalMenu={false}
  on:scrollend={onScrollend}
  on:scroll={onScroll}
/>
