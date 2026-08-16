<script lang="ts">
  import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";
  import type { ComponentProps } from "svelte";

  export let items: ComponentProps<Dropdown>["items"] = [];
  export let selectedId: ComponentProps<Dropdown>["selectedId"] = undefined;
  export let name: ComponentProps<Dropdown>["name"] = undefined;
  export let clearable: ComponentProps<Dropdown>["clearable"] = false;
  export let virtualize: ComponentProps<Dropdown>["virtualize"] = undefined;
  export let portalMenu: ComponentProps<Dropdown>["portalMenu"] = false;
  export let open: ComponentProps<Dropdown>["open"] = false;
</script>

<form data-testid="form">
  <Dropdown
    id="test-dropdown"
    {items}
    bind:selectedId
    {name}
    {clearable}
    {virtualize}
    {portalMenu}
    bind:open
    labelText="Contact"
  />
</form>
