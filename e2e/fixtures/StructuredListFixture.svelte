<script>
  import {
    StructuredList,
    StructuredListBody,
    StructuredListCell,
    StructuredListHead,
    StructuredListInput,
    StructuredListRow,
  } from "carbon-components-svelte";

  let selected = undefined;
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
    <StructuredListRow label for="row-a">
      <StructuredListCell>Row A</StructuredListCell>
      <StructuredListCell>Value A</StructuredListCell>
      <StructuredListInput id="row-a" value="a" title="Select row A" />
    </StructuredListRow>
    <StructuredListRow label for="row-b">
      <StructuredListCell>Row B</StructuredListCell>
      <StructuredListCell>Value B</StructuredListCell>
      <StructuredListInput id="row-b" value="b" title="Select row B" />
    </StructuredListRow>
  </StructuredListBody>
</StructuredList>
<div data-testid="selected-value">{selected ?? "none"}</div>
