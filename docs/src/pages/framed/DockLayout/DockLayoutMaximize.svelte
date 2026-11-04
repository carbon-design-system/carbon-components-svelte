<script>
  import { Box, Button, DockLayout, Stack } from "carbon-components-svelte";

  const documents = [
    { id: "main", label: "main.tf" },
    { id: "variables", label: "variables.tf" },
    { id: "outputs", label: "outputs.tf" },
  ];

  /** @type {import("carbon-components-svelte/DockLayout/DockLayout.svelte").DockLayoutNode} */
  let layout = {
    type: "row",
    sizes: [60, 40],
    children: [
      { type: "group", id: "group-1", tabs: ["main", "variables"] },
      { type: "group", id: "group-2", tabs: ["outputs"] },
    ],
  };
  let maximized = null;
</script>

<Stack gap={5}>
  <Button
    size="small"
    kind="tertiary"
    on:click={() => (maximized = maximized ? null : "group-1")}
  >
    {maximized ? "Restore" : "Maximize"} the first group
  </Button>
  <Box height="16rem" border="subtle">
    <DockLayout bind:layout bind:maximized {documents} aria-label="Workspace">
      <svelte:fragment slot="panel" let:document>
        <p>{document.label} content</p>
      </svelte:fragment>
    </DockLayout>
  </Box>
</Stack>
