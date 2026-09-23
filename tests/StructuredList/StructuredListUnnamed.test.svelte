<script lang="ts">
  import StructuredList from "carbon-components-svelte/StructuredList/StructuredList.svelte";
  import StructuredListBody from "carbon-components-svelte/StructuredList/StructuredListBody.svelte";
  import StructuredListCell from "carbon-components-svelte/StructuredList/StructuredListCell.svelte";
  import StructuredListInput from "carbon-components-svelte/StructuredList/StructuredListInput.svelte";
  import StructuredListRow from "carbon-components-svelte/StructuredList/StructuredListRow.svelte";
</script>

<StructuredList selection>
  <StructuredListBody>
    {#each ["1", "2", "3"] as item}
      <StructuredListRow label for="row-{item}">
        <StructuredListCell>Row {item}</StructuredListCell>
        <StructuredListInput id="row-{item}" value="row-{item}-value" />
      </StructuredListRow>
    {/each}
  </StructuredListBody>
</StructuredList>
