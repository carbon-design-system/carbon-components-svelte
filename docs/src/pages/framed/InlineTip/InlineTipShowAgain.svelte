<script>
  import {
    Button,
    createTipStore,
    InlineTip,
    localTipStorage,
    setTipStore,
    Stack,
  } from "carbon-components-svelte";

  const tips = createTipStore({
    storage: localTipStorage("docs:show-again-tips"),
  });

  setTipStore(tips);

  // A store is a Svelte store: `$tips.dismissed` holds the ids dismissed.
  $: dismissedCount = $tips.dismissed.size;
</script>

<Stack gap={5}>
  <InlineTip id="show-again-filters" title="Filter by owner">
    Narrow the table to the rows one person owns.
  </InlineTip>
  <InlineTip id="show-again-views" title="Save a view">
    Keep a set of filters and columns to open again later.
  </InlineTip>
  <Stack orientation="horizontal" gap={5}>
    <Button
      kind="tertiary"
      size="small"
      disabled={dismissedCount === 0}
      on:click={() => tips.reset()}
    >
      Show tips again
    </Button>
    <Button
      kind="ghost"
      size="small"
      disabled={!$tips.dismissed.has("show-again-views")}
      on:click={() => tips.reset("show-again-views")}
    >
      Show the saved views tip
    </Button>
  </Stack>
</Stack>
