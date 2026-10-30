<script>
  import {
    Button,
    Coachmark,
    LocalStorage,
    Stack,
  } from "carbon-components-svelte";
  import { onMount } from "svelte";

  let storage;
  let seen = false;
  let open = false;

  onMount(() => {
    open = !seen;
  });
</script>

<LocalStorage bind:this={storage} key="tip:saved-views" bind:value={seen} />

<Stack orientation="horizontal" gap={7}>
  <Coachmark
    bind:open
    titleText="Saved views"
    align="bottom-start"
    on:close={() => (seen = true)}
  >
    Pick up where you left off.
  </Coachmark>
  <Button
    kind="tertiary"
    size="small"
    on:click={() => {
      storage.clearItem();
      open = true;
    }}
  >
    Show again
  </Button>
</Stack>
