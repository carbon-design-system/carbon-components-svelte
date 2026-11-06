<script>
  import { Button, TooltipIcon } from "carbon-components-svelte";
  import Edit from "carbon-components-svelte/icons/Edit.svelte";
  import Information from "carbon-components-svelte/icons/Information.svelte";

  const text = "Requests in the last 30 days, summed across every region";
</script>

<!-- A portalled tooltip beside its trigger, with the trigger at the top and
     at the bottom edge of the window. A tooltip centered on the trigger
     there runs past the edge. -->
<div
  style="position: fixed; top: 0.25rem; left: 4rem; display: flex; gap: 8rem"
>
  <span data-testid="TooltipIcon-top">
    <TooltipIcon
      icon={Information}
      tooltipText={text}
      direction="right"
      portalTooltip
    />
  </span>
  <span data-testid="Button-top">
    <Button
      kind="ghost"
      size="small"
      icon={Edit}
      iconDescription={text}
      tooltipPosition="right"
      portalTooltip
    />
  </span>
</div>

<div
  style="position: fixed; bottom: 0.25rem; left: 4rem; display: flex; gap: 8rem"
>
  <span data-testid="TooltipIcon-bottom">
    <TooltipIcon
      icon={Information}
      tooltipText={text}
      direction="right"
      portalTooltip
    />
  </span>
  <span data-testid="Button-bottom">
    <Button
      kind="ghost"
      size="small"
      icon={Edit}
      iconDescription={text}
      tooltipPosition="right"
      portalTooltip
    />
  </span>
</div>
