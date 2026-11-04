<script>
  import { Box, DockLayout } from "carbon-components-svelte";

  const documents = [
    { id: "main", label: "main.tf" },
    { id: "variables", label: "variables.tf" },
    { id: "outputs", label: "outputs.tf" },
    { id: "providers", label: "providers.tf" },
    { id: "deploy", label: "deploy.yaml" },
    { id: "readme", label: "README.md" },
  ];

  /** @type {import("carbon-components-svelte/DockLayout/DockLayout.svelte").DockLayoutNode} */
  let layout = {
    type: "row",
    sizes: [55, 45],
    children: [
      { type: "group", id: "group-1", tabs: ["main", "variables", "outputs"] },
      {
        type: "column",
        sizes: [60, 40],
        children: [
          { type: "group", id: "group-2", tabs: ["providers", "deploy"] },
          { type: "group", id: "group-3", tabs: ["readme"] },
        ],
      },
    ],
  };
</script>

<Box height="26rem" border="subtle">
  <DockLayout bind:layout {documents} aria-label="Workspace">
    <svelte:fragment slot="panel" let:document>
      <p>{document.label} content</p>
    </svelte:fragment>
  </DockLayout>
</Box>
