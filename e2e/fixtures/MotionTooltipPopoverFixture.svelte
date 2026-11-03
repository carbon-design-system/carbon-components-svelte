<script lang="ts">
  import Box from "carbon-components-svelte/Box/Box.svelte";
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import Popover from "carbon-components-svelte/Popover/Popover.svelte";
  import Stack from "carbon-components-svelte/Stack/Stack.svelte";
  import Toggletip from "carbon-components-svelte/Toggletip/Toggletip.svelte";
  import Tooltip from "carbon-components-svelte/Tooltip/Tooltip.svelte";
  import TooltipGroup from "carbon-components-svelte/TooltipGroup/TooltipGroup.svelte";

  let popoverOpen = false;
  let clippedPopoverOpen = false;
</script>

<Stack gap={9}>
  <Box position="relative">
    <Button on:click={() => (popoverOpen = !popoverOpen)}>Open popover</Button>
    <Popover
      transition
      bind:open={popoverOpen}
      align="bottom-start"
      closeOnEscape
    >
      <p data-testid="popover-content">Popover content</p>
    </Popover>
  </Box>

  <Box padding={5} border="subtle" maxWidth="8rem" overflow="hidden">
    <Box position="relative">
      <Button on:click={() => (clippedPopoverOpen = !clippedPopoverOpen)}>
        Open clipped popover
      </Button>
      <Popover
        transition
        bind:open={clippedPopoverOpen}
        align="bottom-start"
        closeOnEscape
      >
        <p data-testid="clipped-popover-content">
          Popover content that the box would cut off
        </p>
      </Popover>
    </Box>
  </Box>

  <Toggletip transition iconDescription="Toggletip" align="start">
    <p data-testid="toggletip-content">Toggletip content</p>
  </Toggletip>

  <TooltipGroup>
    <Stack orientation="horizontal" gap={7}>
      <Tooltip transition iconDescription="Tooltip">
        <p data-testid="tooltip-content">Tooltip content</p>
      </Tooltip>
      <Tooltip transition iconDescription="Neighbor">
        <p data-testid="neighbor-content">Neighbor content</p>
      </Tooltip>
    </Stack>
  </TooltipGroup>

  <Box padding={5} border="subtle" maxWidth="8rem" overflow="hidden">
    <Tooltip transition iconDescription="Clipped tooltip">
      <p data-testid="clipped-tooltip-content">
        Tooltip content that the box would cut off
      </p>
    </Tooltip>
  </Box>
</Stack>
