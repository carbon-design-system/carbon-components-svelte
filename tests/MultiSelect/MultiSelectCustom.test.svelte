<svelte:options accessors />

<script lang="ts">
  import MultiSelect from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
  import type { ComponentProps } from "svelte";

  export let multiSelectRef: MultiSelect | undefined = undefined;

  export let items: ComponentProps<MultiSelect>["items"] = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
  ];
  export let selectedIds: ComponentProps<MultiSelect>["selectedIds"] = [];
  export let filterable: ComponentProps<MultiSelect>["filterable"] = false;
  export let clearOptions: { focus?: boolean; open?: boolean } = {};
</script>

<MultiSelect
  bind:this={multiSelectRef}
  {items}
  {selectedIds}
  {filterable}
  labelText="Contact methods"
  label="Select contact methods..."
/>

<button type="button" on:click={() => multiSelectRef?.clear(clearOptions)}>
  Clear
</button>
<button type="button" on:click={() => multiSelectRef?.clear({ focus: false })}>
  Clear (no focus)
</button>
<button type="button" on:click={() => multiSelectRef?.clear({ open: true })}>
  Clear (reopen)
</button>
