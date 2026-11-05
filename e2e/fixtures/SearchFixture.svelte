<script lang="ts">
  import { Search } from "carbon-components-svelte";

  let value = "";
  let valueExpandable = "";
  let expanded = false;
</script>

<Search
  data-testid="search-query"
  labelText="Search"
  placeholder="Search..."
  bind:value
/>

<Search
  data-testid="search-expandable"
  labelText="Expandable search"
  placeholder="Search..."
  expandable={true}
  bind:expanded
  bind:value={valueExpandable}
/>
<div data-testid="sticky-shortcut" style="position: sticky; top: 0">
  <Search labelText="Sticky search" shortcut="/" />
</div>
<div style="height: 200vh"></div>
<div data-testid="variants" style="width: 20rem">
  {#each ["default", "fill", "ghost"] as const as variant (variant)}
    <div data-variant={variant}>
      <Search
        size="sm"
        {variant}
        labelText="Search {variant}"
        closeButtonLabelText="Clear {variant}"
      />
    </div>
  {/each}
  <div data-variant="ghost-value">
    <Search
      size="sm"
      variant="ghost"
      value="arrow"
      labelText="Search ghost with a value"
      closeButtonLabelText="Clear ghost with a value"
    />
  </div>
</div>
