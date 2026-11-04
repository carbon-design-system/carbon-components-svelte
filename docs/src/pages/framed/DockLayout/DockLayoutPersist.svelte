<script>
  import {
    Box,
    Button,
    DockLayout,
    LocalStorage,
    reconcileDockLayout,
    Stack,
  } from "carbon-components-svelte";

  const documents = [
    { id: "main", label: "main.tf" },
    { id: "variables", label: "variables.tf" },
    { id: "outputs", label: "outputs.tf" },
    { id: "deploy", label: "deploy.yaml" },
  ];
  const ids = documents.map((document) => document.id);

  /** @type {import("carbon-components-svelte/DockLayout/DockLayout.svelte").DockLayoutNode} */
  const initial = {
    type: "row",
    sizes: [50, 50],
    children: [
      { type: "group", id: "group-1", tabs: ["main", "variables"] },
      { type: "group", id: "group-2", tabs: ["outputs", "deploy"] },
    ],
  };

  /** @type {import("carbon-components-svelte/DockLayout/DockLayout.svelte").DockLayoutNode} */
  let layout = initial;
</script>

<!-- The layout is plain JSON, so it saves and reads back as it is. -->
<LocalStorage key="dock-layout-example" bind:value={layout} />

<Stack gap={5}>
  <Stack gap={3} orientation="horizontal">
    <Button
      size="small"
      kind="tertiary"
      on:click={() => (layout = reconcileDockLayout(layout, ids))}
    >
      Reopen closed documents
    </Button>
    <Button size="small" kind="ghost" on:click={() => (layout = initial)}>
      Reset layout
    </Button>
  </Stack>
  <Box height="18rem" border="subtle">
    <DockLayout bind:layout {documents} aria-label="Workspace">
      <svelte:fragment slot="panel" let:document>
        <p>{document.label} content</p>
      </svelte:fragment>
    </DockLayout>
  </Box>
</Stack>
