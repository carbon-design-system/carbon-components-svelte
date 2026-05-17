<script lang="ts">
  import {
    StructuredList,
    StructuredListBody,
    StructuredListCell,
    StructuredListHead,
    StructuredListInput,
    StructuredListRow,
  } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let selected: ComponentProps<StructuredList>["selected"] = undefined;
</script>

<StructuredList
  selection
  bind:selected
  on:change={(e) => {
    console.log("change", e.detail);
  }}
>
  <StructuredListHead>
    <StructuredListRow head>
      <StructuredListCell head>Column A</StructuredListCell>
    </StructuredListRow>
  </StructuredListHead>
  <StructuredListBody>
    <StructuredListRow label for="row-1">
      <StructuredListCell>Row 1</StructuredListCell>
      <StructuredListInput id="row-1" value="row-1-value" name="row-name" />
    </StructuredListRow>
    <StructuredListRow label for="row-2">
      <StructuredListCell>Row 2</StructuredListCell>
      <StructuredListInput
        id="row-2"
        value="row-2-value"
        name="row-name"
        checked
      />
    </StructuredListRow>
  </StructuredListBody>
</StructuredList>
