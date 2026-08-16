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
  />
</form>
