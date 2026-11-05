<script lang="ts">
  import {
    StructuredList,
    StructuredListBody,
    StructuredListCell,
    StructuredListHead,
    StructuredListInput,
    StructuredListRow,
  } from "carbon-components-svelte";

  let selected: string | undefined;
  let selectedMany = ["c"];
</script>

<StructuredList data-testid="structured-list" bind:selected selection>
  <StructuredListHead>
    <StructuredListRow head>
      <StructuredListCell head>Name</StructuredListCell>
      <StructuredListCell head>Value</StructuredListCell>
      <StructuredListCell head>{""}</StructuredListCell>
    </StructuredListRow>
  </StructuredListHead>
  <StructuredListBody>
    <StructuredListRow label for="row-a" value="a">
      <StructuredListCell>Row A</StructuredListCell>
      <StructuredListCell>Value A</StructuredListCell>
      <StructuredListInput id="row-a" value="a" title="Select row A" />
    </StructuredListRow>
    <StructuredListRow label for="row-b" value="b">
      <StructuredListCell>Row B</StructuredListCell>
      <StructuredListCell>Value B</StructuredListCell>
      <StructuredListInput id="row-b" value="b" title="Select row B" />
    </StructuredListRow>
  </StructuredListBody>
</StructuredList>
<div data-testid="selected-value">{selected ?? "none"}</div>

<StructuredList
  data-testid="structured-list-multiple"
  bind:selected={selectedMany}
  selection
  multiple
>
  <StructuredListHead>
    <StructuredListRow head>
      <StructuredListCell head>Name</StructuredListCell>
      <StructuredListCell head>Value</StructuredListCell>
    </StructuredListRow>
  </StructuredListHead>
  <StructuredListBody>
    {#each ["c", "d", "e"] as id}
      {@const name = id.toUpperCase()}
      <StructuredListRow label for="row-{id}" value={id}>
        <StructuredListCell>Row {name}</StructuredListCell>
        <StructuredListCell>Value {name}</StructuredListCell>
        <StructuredListInput
          id="row-{id}"
          value={id}
          title="Select row {name}"
          disabled={id === "e"}
        />
      </StructuredListRow>
    {/each}
  </StructuredListBody>
</StructuredList>
<div data-testid="selected-many">{selectedMany.join(",")}</div>
