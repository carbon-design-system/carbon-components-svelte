<script>
  import { Box, Button, rovingFocus, Stack } from "carbon-components-svelte";

  const environments = ["Production", "Staging", "Development"];
  let active = 0;
</script>

<Box width="12rem">
  <Stack as gap={3} let:props>
    <div
      {...props}
      role="toolbar"
      aria-orientation="vertical"
      aria-label="Environments"
      use:rovingFocus={{
        selector: "button",
        orientation: "vertical",
        getActiveIndex: () => active,
        onMove: (index) => (active = index),
        focusOnMove: true,
      }}
    >
      {#each environments as environment, i}
        <Button
          kind="tertiary"
          size="small"
          tabindex={i === active ? 0 : -1}
          on:focus={() => (active = i)}
        >
          {environment}
        </Button>
      {/each}
    </div>
  </Stack>
</Box>
