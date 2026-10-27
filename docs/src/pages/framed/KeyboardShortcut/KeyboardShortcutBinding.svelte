<script>
  import {
    Button,
    KeyboardShortcut,
    Stack,
    Text,
  } from "carbon-components-svelte";

  let searches = 0;

  function search() {
    searches += 1;
  }

  function handleKeydown(event) {
    if (event.repeat || !(event.metaKey || event.ctrlKey)) return;
    if (event.key.toLowerCase() !== "k") return;
    event.preventDefault();
    search();
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<Stack gap={5}>
  <Button aria-keyshortcuts="Meta+K Control+K" on:click={search}>
    Search
    <KeyboardShortcut shortcut="mod+k" size="sm" decorative />
  </Button>
  <Text>Searches started: {searches}</Text>
</Stack>
