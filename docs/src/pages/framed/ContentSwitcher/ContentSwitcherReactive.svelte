<script>
  import { Button, ContentSwitcher, Switch } from "carbon-components-svelte";

  let selectedIndex = 1;
</script>

<ContentSwitcher bind:selectedIndex>
  <Switch text="Latest news" />
  <Switch text="Trending" />
  <Switch text="Recommended" />
</ContentSwitcher>

<div>
  <Button
    size="small"
    disabled={selectedIndex === 2}
    on:click={() => (selectedIndex = 2)}
  >
    Set selected to 2
  </Button>
</div>

<div>Selected index: {selectedIndex}</div>

<style>
  div {
    margin-top: var(--cds-spacing-05);
  }
</style>
