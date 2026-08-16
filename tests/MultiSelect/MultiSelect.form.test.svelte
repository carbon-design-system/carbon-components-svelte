<svelte:options accessors />

<script lang="ts">
  import MultiSelect from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
  import type { ComponentProps } from "svelte";

  export let items: ComponentProps<MultiSelect>["items"] = [];
  export let selectedIds: ComponentProps<MultiSelect>["selectedIds"] = [];
  export let itemToInput: ComponentProps<MultiSelect>["itemToInput"] =
    undefined;
  export let name: ComponentProps<MultiSelect>["name"] = undefined;
  export let filterable = false;
  export let filterItem: ComponentProps<MultiSelect>["filterItem"] = undefined;
  export let open: ComponentProps<MultiSelect>["open"] = undefined;
  export let virtualize: ComponentProps<MultiSelect>["virtualize"] = undefined;
  export let portalMenu: ComponentProps<MultiSelect>["portalMenu"] = false;
  export let value: ComponentProps<MultiSelect>["value"] = "";
</script>

<form data-testid="form">
  <MultiSelect
    labelText="Contact"
    label="Select contact methods..."
    {items}
    {selectedIds}
    {itemToInput}
    {name}
    {filterable}
    {filterItem}
    {open}
    {virtualize}
    {portalMenu}
    bind:value
  />
</form>
