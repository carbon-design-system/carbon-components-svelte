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
    <svelte:fragment slot="above">
      <div>Payments API — Operational</div>
      {#if grow}
        <div>Elevated error rate detected on the /charges endpoint.</div>
        <div>
          The resize observer remeasures the collapsed height as new alerts
          stream in.
        </div>
      {/if}
    </svelte:fragment>
    <svelte:fragment slot="below">
      No open incidents. On-call engineer: Priya Natarajan.
    </svelte:fragment>
  </ExpandableTile>
</Stack>
