<script>
  import {
    Button,
    ButtonSet,
    ExpandableTile,
    Stack,
  } from "carbon-components-svelte";

  let expanded = false;
  let grow = false;
</script>

<Stack gap={5}>
  <ButtonSet>
    <Button size="small" on:click={() => (expanded = !expanded)}>
      {expanded ? "Collapse" : "Expand"}
      tile
    </Button>
    <Button size="small" kind="secondary" on:click={() => (grow = !grow)}>
      {grow ? "Shrink" : "Grow"}
      content
    </Button>
  </ButtonSet>
  <div>Expanded: <strong>{expanded}</strong></div>
  <ExpandableTile bind:expanded>
    <div slot="above">
      <div>Above the fold content here</div>
      {#if grow}
        <div>Extra line added dynamically.</div>
        <div>The resize observer remeasures the collapsed height.</div>
      {/if}
    </div>
    <div slot="below">Below the fold content here</div>
  </ExpandableTile>
</Stack>
