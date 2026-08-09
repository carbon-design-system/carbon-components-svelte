<script lang="ts">
  import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";
  import type { ComponentProps } from "svelte";

  export let items: ComponentProps<Dropdown>["items"] = [];
  export let open: ComponentProps<Dropdown>["open"] = false;
  export let selectedId: ComponentProps<Dropdown>["selectedId"] = undefined;
  export let onSelect: (e: CustomEvent) => void = () => {};
</script>

<Dropdown
  {items}
  bind:open
  bind:selectedId
  labelText="Contact"
  portalMenu={false}
  on:select={onSelect}
/>
