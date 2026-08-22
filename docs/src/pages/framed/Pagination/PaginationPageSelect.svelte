<script>
  import { NumberInput, Pagination } from "carbon-components-svelte";

  let page = 1;
</script>

<Pagination bind:page totalItems={102} pageSizes={[10, 15, 20]}>
  <svelte:fragment slot="pageSelect" let:totalPages let:selectLabelText>
    <NumberInput
      size="sm"
      hideLabel
      hideSteppers
      labelText={selectLabelText}
      min={1}
      max={totalPages}
      bind:value={page}
    />
  </svelte:fragment>
</Pagination>
