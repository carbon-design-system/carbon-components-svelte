<script>
  import { Box, DockLayout } from "carbon-components-svelte";

  const documents = [
    { id: "main", label: "main.tf" },
    { id: "variables", label: "variables.tf" },
    { id: "outputs", label: "outputs.tf" },
    { id: "readme", label: "README.md" },
  ];

  /** @type {import("carbon-components-svelte/DockLayout/DockLayout.svelte").DockLayoutNode} */
  let layout = {
    type: "row",
    sizes: [50, 50],
    children: [
      { type: "group", id: "group-1", tabs: ["main", "variables"] },
      { type: "group", id: "group-2", tabs: ["outputs", "readme"] },
    ],
  };
</script>

<Box height="18rem" border="subtle">
  <DockLayout bind:layout {documents} type="default" aria-label="Workspace">
    <svelte:fragment slot="panel" let:document>
      <p>{document.label} content</p>
    </svelte:fragment>
  </DockLayout>
</Box>
