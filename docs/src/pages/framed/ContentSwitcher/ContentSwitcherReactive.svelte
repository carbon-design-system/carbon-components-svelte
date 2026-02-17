<script>
  import { Button, ContentSwitcher, Stack, Switch } from "carbon-components-svelte";

  let selectedIndex = 1;
</script>

<ContentSwitcher bind:selectedIndex>
  <Switch text="Latest news" />
  <Switch text="Trending" />
  <Switch text="Recommended" />
</ContentSwitcher>

<Stack gap={5}>
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
</Stack>
