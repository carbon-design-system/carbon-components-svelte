<script lang="ts">
  import { Search } from "carbon-components-svelte";

  export let expanded = false;

  let expandEvent = false;
  let collapseEvent = false;
</script>

<Search
  expandable
  {expanded}
  labelText="Initial event search"
  placeholder="Search..."
  on:expand={() => {
    expandEvent = true;
  }}
  on:collapse={() => {
    collapseEvent = true;
  }}
/>

<div data-testid="expand-event">{expandEvent}</div>
<div data-testid="collapse-event">{collapseEvent}</div>
