<script lang="ts">
import { Tooltip } from "carbon-components-svelte";

let openCount = 0;
let closeCount = 0;

function handleOpen() {
  openCount += 1;
}

function handleClose() {
  closeCount += 1;
}
</script>

<div>
  <p>Open events: {openCount}</p>
  <p>Close events: {closeCount}</p>

  <Tooltip
    iconDescription="Information"
    on:open={handleOpen}
    on:close={handleClose}
  >
    Interact with this tooltip to trigger events
  </Tooltip>
</div>
