<script lang="ts">
  import TransferList from "carbon-components-svelte/TransferList/TransferList.svelte";

  // The list's label is its legend, so map the contract's label props onto it.
  export let hideLabel = false;
</script>

<TransferList
  items={[
    { id: "a", text: "A" },
    { id: "b", text: "B" },
  ]}
  {...$$restProps}
  hideLegend={hideLabel}
>
  <svelte:fragment slot="legendChildren"
    ><slot name="labelChildren" /></svelte:fragment
  >
</TransferList>
