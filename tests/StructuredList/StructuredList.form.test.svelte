<svelte:options accessors />

<script lang="ts">
  import StructuredList from "carbon-components-svelte/StructuredList/StructuredList.svelte";
  import StructuredListBody from "carbon-components-svelte/StructuredList/StructuredListBody.svelte";
  import StructuredListCell from "carbon-components-svelte/StructuredList/StructuredListCell.svelte";
  import StructuredListInput from "carbon-components-svelte/StructuredList/StructuredListInput.svelte";
  import StructuredListRow from "carbon-components-svelte/StructuredList/StructuredListRow.svelte";

  export let selected: string | string[] | undefined = undefined;
  export let multiple = false;
  export let onChange: () => void = () => {};
</script>

<form data-testid="form">
  <StructuredList selection {multiple} bind:selected on:change={onChange}>
    <StructuredListBody>
      {#each ["postgresql", "mongodb", "redis"] as engine}
        <StructuredListRow label for={engine} value={engine}>
          <StructuredListCell>{engine}</StructuredListCell>
          <StructuredListInput id={engine} value={engine} name="engine" />
        </StructuredListRow>
      {/each}
    </StructuredListBody>
  </StructuredList>
</form>
<p data-testid="bound">{JSON.stringify(selected) ?? "undefined"}</p>
