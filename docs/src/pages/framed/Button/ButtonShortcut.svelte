<script>
  import { Button, Stack } from "carbon-components-svelte";
  import Save from "carbon-icons-svelte/lib/Save.svelte";

  let saves = 0;
</script>

<Stack orientation="horizontal" gap={5} align="center">
  <Button shortcut="mod+s" on:click={() => saves++}>Save</Button>
  <Button
    kind="ghost"
    shortcut="mod+shift+s"
    icon={Save}
    iconDescription="Save as"
  />
  <span>Saved {saves} {saves === 1 ? "time" : "times"}</span>
</Stack>
