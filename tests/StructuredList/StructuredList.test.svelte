<script lang="ts">
  import StructuredList from "carbon-components-svelte/StructuredList/StructuredList.svelte";
  import StructuredListBody from "carbon-components-svelte/StructuredList/StructuredListBody.svelte";
  import StructuredListCell from "carbon-components-svelte/StructuredList/StructuredListCell.svelte";
  import StructuredListHead from "carbon-components-svelte/StructuredList/StructuredListHead.svelte";
  import StructuredListInput from "carbon-components-svelte/StructuredList/StructuredListInput.svelte";
  import StructuredListRow from "carbon-components-svelte/StructuredList/StructuredListRow.svelte";
  import type { ComponentProps } from "svelte";

  export let selected: ComponentProps<StructuredList>["selected"] = undefined;
  export let condensed: ComponentProps<StructuredList>["condensed"] = false;
  export let flush: ComponentProps<StructuredList>["flush"] = false;
  export let selection: ComponentProps<StructuredList>["selection"] = false;
  export let multiple: ComponentProps<StructuredList>["multiple"] = false;
  export let sortable = false;
  export let icon: ComponentProps<StructuredList>["icon"] = undefined;
  /** Value of the row whose input renders with `checked`. */
  export let checkedValue: string | undefined = undefined;
  /** Leaves the inputs without a `name`, so the list assigns one. */
  export let unnamed = false;
  /** Name for the list's radio group; used by inputs left unnamed. */
  export let name: ComponentProps<StructuredList>["name"] = undefined;
  export let onClick: () => void = () => {};
  export let onMouseOver: () => void = () => {};
  export let onMouseLeave: () => void = () => {};
  export let onChange: (detail: unknown) => void = () => {};
  export let onSort: () => void = () => {};
</script>

<StructuredList
  bind:selected
  {condensed}
  {flush}
  {selection}
  {multiple}
  {icon}
  {name}
  on:click={onClick}
  on:mouseover={onMouseOver}
  on:mouseleave={onMouseLeave}
  on:change={(e) => onChange(e.detail)}
>
  <StructuredListHead>
    <StructuredListRow head>
      <StructuredListCell head {sortable} on:sort={onSort}
        >Column A</StructuredListCell
      >
      <StructuredListCell head>Column B</StructuredListCell>
      <StructuredListCell head>Column C</StructuredListCell>
    </StructuredListRow>
  </StructuredListHead>
  <StructuredListBody>
    {#each ["1", "2", "3"] as item}
      <StructuredListRow
        label={selection}
        for={selection ? `row-${item}` : undefined}
        value={selection ? `row-${item}-value` : undefined}
      >
        <StructuredListCell noWrap>Row {item}</StructuredListCell>
        <StructuredListCell>Row {item}</StructuredListCell>
        <StructuredListCell>Content {item}</StructuredListCell>
        {#if selection}
          <StructuredListInput
            id="row-{item}"
            value="row-{item}-value"
            title="row-{item}-title"
            name={unnamed ? "" : `row-${item}-name`}
            checked={checkedValue === `row-${item}-value`}
          />
        {/if}
      </StructuredListRow>
    {/each}
  </StructuredListBody>
</StructuredList>

<div data-testid="value">{multiple ? JSON.stringify(selected) : selected}</div>
