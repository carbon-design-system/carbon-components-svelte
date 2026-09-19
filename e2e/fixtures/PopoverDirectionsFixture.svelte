<script>
  import { Popover } from "carbon-components-svelte";

  const directions = [
    "top",
    "top-left",
    "top-right",
    "bottom",
    "bottom-left",
    "bottom-right",
    "left",
    "left-top",
    "left-bottom",
    "right",
    "right-top",
    "right-bottom",
  ];
</script>

{#each directions as align (align)}
  <div
    data-testid="popover-direction-{align}"
    style="position: relative; display: inline-block; margin: 3rem;"
  >
    <Popover {align} open caret relative>
      <div style="padding: 1rem;">{align}</div>
    </Popover>
  </div>
{/each}
