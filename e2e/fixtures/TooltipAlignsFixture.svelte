<script>
  import {
    Button,
    Link,
    Tooltip,
    TooltipDefinition,
    TooltipIcon,
  } from "carbon-components-svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
</script>

<!--
  Tooltip triggers in every direction and alignment, left to right and right
  to left, open interactive tooltips holding a link and a button, and a
  disabled icon tooltip. CSS coverage for the
  `.bx--tooltip--align-*` and `[dir=rtl]` tooltip rules, which no other
  fixture renders.
-->
{#each ["ltr", "rtl"] as dir}
  <div {dir} class="grid" data-testid="aligns-{dir}">
    {#each ["top", "bottom", "left", "right"] as direction}
      {#each ["start", "center", "end"] as align}
        <TooltipDefinition
          {direction}
          {align}
          tooltipText="{direction} {align}"
        >
          {direction}
          {align}
        </TooltipDefinition>
        <TooltipIcon {direction} {align} tooltipText="{direction} {align}" />
        <Button
          iconOnly
          icon={Add}
          iconDescription="{direction} {align}"
          tooltipPosition={direction}
          tooltipAlignment={align}
        />
      {/each}
    {/each}
  </div>
{/each}
<!-- Tooltip keeps only top and bottom tooltips in the window, so each side
     tooltip opens from the edge that leaves it room. -->
<div class="open" data-testid="open">
  {#each ["left", "right"] as direction}
    <div class="open-{direction}">
      <Tooltip open {direction} align="end" triggerText="{direction} end">
        <p>Open, with a <Link href="#top">link</Link>.</p>
        <Button size="sm">Action</Button>
      </Tooltip>
    </div>
  {/each}
</div>
<div data-testid="disabled">
  <TooltipIcon disabled tooltipText="Disabled" />
</div>

<style>
  /* One centered column leaves room for tooltips on either side, even on
     a 320px page. */
  .grid {
    display: grid;
    justify-items: center;
    gap: 2rem;
    padding-block: 3rem;
  }
  .open {
    display: grid;
    gap: 6rem;
    padding-block: 3rem;
  }
  .open-left {
    justify-self: end;
  }
  .open-right {
    justify-self: start;
  }
</style>
