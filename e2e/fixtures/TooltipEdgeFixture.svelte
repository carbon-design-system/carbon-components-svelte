<script>
  import { Tooltip } from "carbon-components-svelte";

  const text =
    "Regions closer to your users answer faster. Data stays in the region you pick.";
</script>

<div
  data-testid="edge"
  style="display: flex; justify-content: flex-end; gap: 2rem; padding: 4rem 0.5rem 0"
>
  <Tooltip iconDescription="In place" data-testid="in-place">
    <p>{text}</p>
  </Tooltip>
  <Tooltip iconDescription="Portalled" portalTooltip data-testid="portalled">
    <p>{text}</p>
  </Tooltip>
</div>

<div style="height: 120vh"></div>

<div data-testid="bottom" style="padding: 0 0 0.5rem 4rem">
  <Tooltip iconDescription="At the bottom" data-testid="bottom-tooltip">
    <p>{text}</p>
  </Tooltip>
</div>
