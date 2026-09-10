<svelte:options accessors />

<script lang="ts">
  import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";
  import type { ComponentProps } from "svelte";

  export let dropdownRef: Dropdown | undefined = undefined;

  export let items: ComponentProps<Dropdown>["items"] = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
  ];
  export let selectedId: ComponentProps<Dropdown>["selectedId"] = undefined;
  export let clearOptions: { focus?: boolean; open?: boolean } = {};
</script>

<Dropdown
  bind:this={dropdownRef}
  {items}
  {selectedId}
  clearable
  labelText="Contact"
  label="Choose a contact method"
/>

<button type="button" on:click={() => dropdownRef?.clear(clearOptions)}>
  Clear
</button>
<button type="button" on:click={() => dropdownRef?.clear({ focus: false })}>
  Clear (no focus)
</button>
<button type="button" on:click={() => dropdownRef?.clear({ open: true })}>
  Clear (reopen)
</button>
