<script>
  import { Button, Stack } from "carbon-components-svelte";

  let exports = 0;
</script>

<Stack orientation="horizontal" gap={5} align="center">
  <Button
    kind="tertiary"
    shortcut="mod+e"
    on:shortcut={(e) => {
      e.preventDefault();
      exports++;
    }}
  >
    Export
  </Button>
  <span>Exported {exports} {exports === 1 ? "time" : "times"} by shortcut</span>
</Stack>
