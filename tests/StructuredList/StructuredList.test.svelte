<script lang="ts">
  import {
    StructuredList,
    StructuredListBody,
    StructuredListCell,
    StructuredListHead,
    StructuredListInput,
    StructuredListRow,
  } from "carbon-components-svelte";
  import CheckmarkFilled from "carbon-icons-svelte/lib/CheckmarkFilled.svelte";
  import type { ComponentProps } from "svelte";

  export let selected: ComponentProps<StructuredList>["selected"] = undefined;
  export let condensed: ComponentProps<StructuredList>["condensed"] = false;
  export let flush: ComponentProps<StructuredList>["flush"] = false;
  export let selection: ComponentProps<StructuredList>["selection"] = false;
</script>

<StructuredList
  bind:selected
  {condensed}
  {flush}
  {selection}
  on:click={() => {
    console.log("click");
  }}
  on:mouseover={() => {
    console.log("mouseover");
  }}
  on:mouseenter={() => {
    console.log("mouseenter");
  }}
  on:mouseleave={() => {
    console.log("mouseleave");
  }}
  on:change={(e) => {
    console.log("change", e.detail);
  }}
>
  <StructuredListHead>
    <StructuredListRow head>
      <StructuredListCell head>Column A</StructuredListCell>
      <StructuredListCell head>Column B</StructuredListCell>
      <StructuredListCell head>Column C</StructuredListCell>
      {#if selection}
        <StructuredListCell head>{""}</StructuredListCell>
      {/if}
    </StructuredListRow>
  </StructuredListHead>
  <StructuredListBody>
    {#each ["1", "2", "3"] as item}
      <StructuredListRow
        label={selection}
        for={selection ? `row-${item}` : undefined}
      >
        <StructuredListCell noWrap>Row {item}</StructuredListCell>
        <StructuredListCell>Row {item}</StructuredListCell>
        <StructuredListCell>Content {item}</StructuredListCell>
        {#if selection}
          <StructuredListInput
            id="row-{item}"
            value="row-{item}-value"
            title="row-{item}-title"
            name="row-{item}-name"
          />
          <StructuredListCell>
            <CheckmarkFilled
              class="bx--structured-list-svg"
              aria-label="select an option"
              title="select an option"
            />
          </StructuredListCell>
        {/if}
      </StructuredListRow>
    {/each}
  </StructuredListBody>
</StructuredList>

<div data-testid="value">{selected}</div>
