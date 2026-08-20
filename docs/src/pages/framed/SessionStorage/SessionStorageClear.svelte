<script>
  import {
    Button,
    SessionStorage,
    Stack,
    Toggle,
  } from "carbon-components-svelte";

  let storage;
  let toggled = false;

  $: document.documentElement.setAttribute("theme", toggled ? "g100" : "white");
</script>

<Stack gap={6}>
  <SessionStorage bind:this={storage} bind:value={toggled} />

  <Toggle size="sm" labelText="Dark mode" bind:toggled />

  <div>
    Toggle the switch, then refresh the page to confirm the value persists.
    <code>clearItem</code>
    removes just this key; <code>clearAll</code> removes every key in session
    storage. Either way, the toggle itself is left untouched until you refresh.
  </div>

  <Stack gap={3} orientation="horizontal">
    <Button size="small" on:click={() => storage.clearItem()}>
      Clear item
    </Button>
    <Button size="small" kind="danger" on:click={() => storage.clearAll()}>
      Clear all
    </Button>
  </Stack>
</Stack>
