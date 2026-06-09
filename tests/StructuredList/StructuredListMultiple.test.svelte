<script lang="ts">
  import StructuredList from "carbon-components-svelte/StructuredList/StructuredList.svelte";
  import StructuredListBody from "carbon-components-svelte/StructuredList/StructuredListBody.svelte";
  import StructuredListCell from "carbon-components-svelte/StructuredList/StructuredListCell.svelte";
  import StructuredListHead from "carbon-components-svelte/StructuredList/StructuredListHead.svelte";
  import StructuredListInput from "carbon-components-svelte/StructuredList/StructuredListInput.svelte";
  import StructuredListRow from "carbon-components-svelte/StructuredList/StructuredListRow.svelte";
  import type { ComponentProps } from "svelte";

  export let selected: ComponentProps<StructuredList>["selected"] = undefined;
</script>

<StructuredList
  selection
  multiple
  bind:selected
  on:change={(e) => {
    console.log("change", e.detail);
  }}
>
  <StructuredListHead>
    <StructuredListRow head>
      <StructuredListCell head>Column A</StructuredListCell>
      <StructuredListCell head>{""}</StructuredListCell>
    </StructuredListRow>
  </StructuredListHead>
  <StructuredListBody>
    {#each ["1", "2", "3"] as item}
      <StructuredListRow label for="row-{item}">
        <StructuredListCell>Row {item}</StructuredListCell>
        <StructuredListInput
          id="row-{item}"
          value="row-{item}-value"
          title="row-{item}-title"
        />
      </StructuredListRow>
    {/each}
  </StructuredListBody>
</StructuredList>

<div data-testid="value">{JSON.stringify(selected)}</div>
