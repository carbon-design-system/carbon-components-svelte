<script lang="ts">
  import StructuredList from "carbon-components-svelte/StructuredList/StructuredList.svelte";
  import StructuredListBody from "carbon-components-svelte/StructuredList/StructuredListBody.svelte";
  import StructuredListCell from "carbon-components-svelte/StructuredList/StructuredListCell.svelte";
  import StructuredListInput from "carbon-components-svelte/StructuredList/StructuredListInput.svelte";
  import StructuredListRow from "carbon-components-svelte/StructuredList/StructuredListRow.svelte";

  export let selection = false;
</script>

<StructuredList {selection} {...$$restProps}>
  <StructuredListBody>
    <StructuredListRow>
      <StructuredListCell>Row 1</StructuredListCell>
      {#if selection}
        <StructuredListInput value="row-1" title="Row 1" />
      {/if}
    </StructuredListRow>
  </StructuredListBody>
</StructuredList>
