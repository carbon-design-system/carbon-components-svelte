<script lang="ts">
  import {
    StructuredList,
    StructuredListSkeleton,
    StructuredListBody,
    StructuredListHead,
    StructuredListCell,
    StructuredListRow,
    StructuredListInput,
  } from "../types";
  import CheckmarkFilled from "carbon-icons-svelte/lib/CheckmarkFilled.svelte";
</script>

<StructuredList>
  <StructuredListHead>
    <StructuredListRow>
      <StructuredListCell>Column A</StructuredListCell>
      <StructuredListCell>Column B</StructuredListCell>
      <StructuredListCell>Column C</StructuredListCell>
    </StructuredListRow>
  </StructuredListHead>
  <StructuredListBody>
    <StructuredListRow>
      <StructuredListCell noWrap>Row 1</StructuredListCell>
      <StructuredListCell>Row 1</StructuredListCell>
      <StructuredListCell>Row 1.</StructuredListCell>
    </StructuredListRow>
    {#each [1, 2, 3] as item}
      <StructuredListRow tag="label" for="row-{item}" selected={false}>
        <StructuredListCell>Row {item}</StructuredListCell>
        <StructuredListCell>Row {item}</StructuredListCell>
        <StructuredListCell>Row {item}</StructuredListCell>
        <StructuredListInput
          id="row-{item}"
          value="row-{item}-value"
          title="row-{item}-title"
          name="row-{item}-name"
          icon={CheckmarkFilled}
        />
      </StructuredListRow>
    {/each}
  </StructuredListBody>
</StructuredList>

<StructuredListSkeleton count="{3}" />
