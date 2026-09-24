<script lang="ts">
  import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";
  import type { ComponentProps } from "svelte";

  export let items: ComponentProps<ComboBox>["items"] = [];
  export let selectedId: ComponentProps<ComboBox>["selectedId"] = undefined;
  export let value: ComponentProps<ComboBox>["value"] = "";
  export let name: ComponentProps<ComboBox>["name"] = undefined;
  export let virtualize: ComponentProps<ComboBox>["virtualize"] = undefined;
  export let portalMenu: ComponentProps<ComboBox>["portalMenu"] = false;
  export let open: ComponentProps<ComboBox>["open"] = false;
  export let onSelect: (event: CustomEvent) => void = () => {};
  export let onClear: (event: CustomEvent) => void = () => {};
</script>

<form data-testid="form">
  <ComboBox
    id="test-combobox"
    {items}
    bind:selectedId
    bind:value
    {name}
    {virtualize}
    {portalMenu}
    bind:open
    labelText="Contact"
    on:select={onSelect}
    on:clear={onClear}
  />
</form>
<p data-testid="bound-selected-id">{String(selectedId)}</p>
<p data-testid="bound-value">{String(value)}</p>
