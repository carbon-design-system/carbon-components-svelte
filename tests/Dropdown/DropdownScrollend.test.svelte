<script lang="ts">
  import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";
  import type { ComponentProps } from "svelte";

  export let items: ComponentProps<Dropdown>["items"] = [];
  export let open: ComponentProps<Dropdown>["open"] = false;
  export let virtualize: ComponentProps<Dropdown>["virtualize"] = {
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

<Dropdown
  {items}
  bind:open
  {virtualize}
  labelText="Contact"
  portalMenu={false}
  on:scrollend={onScrollend}
  on:scroll={onScroll}
/>
