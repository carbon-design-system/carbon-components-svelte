<script lang="ts">
  import { CodeSnippet } from "carbon-components-svelte";

  export let expanded = false;

  let expandEvent = false;
  let collapseEvent = false;
</script>

<CodeSnippet
  type="multi"
  {expanded}
  code={`node -v
npm -v`}
  on:expand={() => {
    expandEvent = true;
  }}
  on:collapse={() => {
    collapseEvent = true;
  }}
/>

<div data-testid="expand-event">{expandEvent}</div>
<div data-testid="collapse-event">{collapseEvent}</div>
